/**
 * Compensating Transaction Support
 *
 * Since Supabase doesn't support database transactions directly,
 * this module provides a "saga" or "compensating transaction" pattern
 * for multi-step operations that need rollback capability.
 *
 * Each step defines:
 * - execute: The forward operation (returns a result)
 * - rollback: The compensating action (receives the result from execute)
 *
 * If any step fails, all previously completed steps are rolled back
 * in reverse order.
 */

import logger from '../utils/logger.js';

/**
 * @typedef {Object} TransactionStep
 * @property {string} name - Step name for logging
 * @property {Function} execute - Async function to execute (returns result)
 * @property {Function} rollback - Async function to rollback (receives execute result)
 */

/**
 * @typedef {Object} TransactionResult
 * @property {boolean} success - Whether all steps completed
 * @property {Array} results - Results from each step
 * @property {Error|null} error - Error if failed
 * @property {string|null} failedStep - Name of step that failed
 * @property {Array} rolledBack - Names of steps that were rolled back
 */

/**
 * Execute a series of steps with automatic rollback on failure
 *
 * @param {TransactionStep[]} steps - Array of transaction steps
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.continueOnRollbackError] - Continue rolling back even if a rollback fails
 * @param {string} [options.transactionId] - Identifier for logging
 * @returns {Promise<TransactionResult>} Transaction result
 *
 * @example
 * const result = await withTransaction([
 *   {
 *     name: 'createReport',
 *     execute: () => reportRepository.create(reportData),
 *     rollback: (report) => reportRepository.delete(report.id)
 *   },
 *   {
 *     name: 'createScheduledJob',
 *     execute: (results) => schedulerService.scheduleJob({
 *       ...jobData,
 *       reportId: results[0].id
 *     }),
 *     rollback: (job) => schedulerService.cancelJob(job.id)
 *   }
 * ]);
 *
 * if (!result.success) {
 *   throw result.error;
 * }
 */
export async function withTransaction(steps, options = {}) {
  const {
    continueOnRollbackError = true,
    transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  } = options;

  const completedSteps = [];
  const results = [];

  logger.debug('Starting transaction', {
    component: 'Transaction',
    transactionId,
    stepCount: steps.length,
    steps: steps.map((s) => s.name),
  });

  try {
    // Execute each step in order
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepName = step.name || `Step ${i + 1}`;

      logger.debug('Executing step', {
        component: 'Transaction',
        transactionId,
        step: stepName,
        index: i,
      });

      try {
        // Execute step, passing previous results for chaining
        const result = await step.execute(results);
        results.push(result);
        completedSteps.push({ step, result, name: stepName });

        logger.debug('Step completed', {
          component: 'Transaction',
          transactionId,
          step: stepName,
        });
      } catch (stepError) {
        logger.error('Step failed, initiating rollback', {
          component: 'Transaction',
          transactionId,
          step: stepName,
          error: stepError.message,
        });

        // Rollback completed steps in reverse order
        const rolledBack = await rollbackSteps(
          completedSteps,
          transactionId,
          continueOnRollbackError
        );

        return {
          success: false,
          results,
          error: stepError,
          failedStep: stepName,
          rolledBack,
        };
      }
    }

    logger.debug('Transaction completed successfully', {
      component: 'Transaction',
      transactionId,
      completedSteps: completedSteps.length,
    });

    return {
      success: true,
      results,
      error: null,
      failedStep: null,
      rolledBack: [],
    };
  } catch (unexpectedError) {
    // Handle unexpected errors during transaction orchestration
    logger.error('Unexpected transaction error', {
      component: 'Transaction',
      transactionId,
      error: unexpectedError.message,
    });

    // Attempt rollback
    const rolledBack = await rollbackSteps(
      completedSteps,
      transactionId,
      continueOnRollbackError
    );

    return {
      success: false,
      results,
      error: unexpectedError,
      failedStep: 'transaction_orchestration',
      rolledBack,
    };
  }
}

/**
 * Rollback completed steps in reverse order
 * @private
 */
async function rollbackSteps(completedSteps, transactionId, continueOnError) {
  const rolledBack = [];

  // Rollback in reverse order
  for (let i = completedSteps.length - 1; i >= 0; i--) {
    const { step, result, name } = completedSteps[i];

    if (!step.rollback) {
      logger.warn('Step has no rollback function', {
        component: 'Transaction',
        transactionId,
        step: name,
      });
      continue;
    }

    try {
      logger.debug('Rolling back step', {
        component: 'Transaction',
        transactionId,
        step: name,
      });

      await step.rollback(result);
      rolledBack.push(name);

      logger.debug('Rollback completed', {
        component: 'Transaction',
        transactionId,
        step: name,
      });
    } catch (rollbackError) {
      logger.error('Rollback failed', {
        component: 'Transaction',
        transactionId,
        step: name,
        error: rollbackError.message,
      });

      if (!continueOnError) {
        throw rollbackError;
      }
      // Continue with remaining rollbacks even if one fails
    }
  }

  return rolledBack;
}

/**
 * Create a simple two-step transaction helper
 * Commonly used for create + schedule operations
 *
 * @param {Function} createFn - Function to create resource
 * @param {Function} deleteFn - Function to delete resource (receives created result)
 * @param {Function} secondaryFn - Secondary operation (receives created result)
 * @param {Function} secondaryRollbackFn - Rollback for secondary (receives secondary result)
 * @returns {Promise<Object>} Final result
 */
export async function createWithSecondary(
  createFn,
  deleteFn,
  secondaryFn,
  secondaryRollbackFn
) {
  const result = await withTransaction([
    {
      name: 'create',
      execute: createFn,
      rollback: deleteFn,
    },
    {
      name: 'secondary',
      execute: (results) => secondaryFn(results[0]),
      rollback: secondaryRollbackFn,
    },
  ]);

  if (!result.success) {
    throw result.error;
  }

  return {
    primary: result.results[0],
    secondary: result.results[1],
  };
}

/**
 * Execute multiple independent operations with all-or-nothing semantics
 * All operations run in parallel, but if any fail, all successful ones are rolled back
 *
 * @param {TransactionStep[]} operations - Independent operations
 * @returns {Promise<TransactionResult>} Transaction result
 */
export async function withParallelTransaction(operations) {
  const transactionId = `ptxn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const results = new Array(operations.length);
  const completedIndices = [];

  logger.debug('Starting parallel transaction', {
    component: 'Transaction',
    transactionId,
    operationCount: operations.length,
  });

  // Execute all in parallel
  const outcomes = await Promise.allSettled(
    operations.map(async (op, index) => {
      const result = await op.execute();
      results[index] = result;
      completedIndices.push(index);
      return { index, result };
    })
  );

  // Check for failures
  const failures = outcomes.filter((o) => o.status === 'rejected');

  if (failures.length > 0) {
    logger.error('Parallel transaction had failures, rolling back', {
      component: 'Transaction',
      transactionId,
      failureCount: failures.length,
      completedCount: completedIndices.length,
    });

    // Rollback all completed operations
    const rollbackPromises = completedIndices.map(async (index) => {
      const op = operations[index];
      if (op.rollback) {
        try {
          await op.rollback(results[index]);
          return { index, success: true };
        } catch (rollbackError) {
          logger.error('Parallel rollback failed', {
            component: 'Transaction',
            transactionId,
            index,
            error: rollbackError.message,
          });
          return { index, success: false, error: rollbackError };
        }
      }
      return { index, success: true, skipped: true };
    });

    await Promise.all(rollbackPromises);

    return {
      success: false,
      results,
      error: failures[0].reason,
      failedStep: `operation_${failures[0].reason?.index ?? 'unknown'}`,
      rolledBack: completedIndices.map((i) => operations[i].name || `operation_${i}`),
    };
  }

  return {
    success: true,
    results,
    error: null,
    failedStep: null,
    rolledBack: [],
  };
}
