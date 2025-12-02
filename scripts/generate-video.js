/**
 * Demo Video Generation - Master Orchestration Script
 *
 * Single entry point to generate the complete Data Hub demo video.
 * Coordinates: setup → record → compile → validate
 *
 * Usage: npm run video:generate
 *
 * Prerequisites:
 *   1. Local Supabase running: `supabase start`
 *   2. ffmpeg installed: `brew install ffmpeg`
 *   3. Environment variables configured
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  devServerUrl: 'http://localhost:5173',
  devServerStartTimeout: 30000, // 30 seconds
  devServerCheckInterval: 1000, // 1 second

  // Output paths
  outputDir: path.resolve(__dirname, '../client/public/assets/demo'),
  expectedOutputs: ['data-hub-demo.mp4', 'data-hub-demo.webm', 'demo-poster.jpg'],

  // Script paths
  scripts: {
    setup: path.resolve(__dirname, 'setup-demo-data.js'),
    record: path.resolve(__dirname, 'record-demo.js'),
    compile: path.resolve(__dirname, 'compile-demo.js'),
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if dev server is running
 */
function checkDevServer() {
  return new Promise((resolve) => {
    const req = http.get(CONFIG.devServerUrl, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for dev server to be ready
 */
async function waitForDevServer(timeout = CONFIG.devServerStartTimeout) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await checkDevServer()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, CONFIG.devServerCheckInterval));
  }

  return false;
}

/**
 * Run a script and wait for completion
 */
function runScript(scriptPath, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${description}`);
    console.log('='.repeat(60));

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${description} failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run ${description}: ${err.message}`));
    });
  });
}

/**
 * Validate output files exist and have reasonable size
 */
function validateOutputs() {
  console.log('\nValidating output files...');

  const results = [];

  for (const filename of CONFIG.expectedOutputs) {
    const filepath = path.join(CONFIG.outputDir, filename);

    if (!fs.existsSync(filepath)) {
      results.push({ filename, status: 'missing' });
      continue;
    }

    const stats = fs.statSync(filepath);
    const sizeMB = stats.size / (1024 * 1024);

    // MP4 should be at least 5MB for a 2-3 minute video
    // WebM should be at least 3MB
    // Poster should be at least 50KB
    const minSize = filename.endsWith('.mp4') ? 5 : filename.endsWith('.webm') ? 3 : 0.05;

    if (sizeMB < minSize) {
      results.push({ filename, status: 'too_small', size: sizeMB.toFixed(2) });
    } else {
      results.push({ filename, status: 'ok', size: sizeMB.toFixed(2) });
    }
  }

  return results;
}

// =============================================================================
// Prerequisites Check
// =============================================================================

async function checkPrerequisites() {
  console.log('Checking prerequisites...\n');

  const issues = [];

  // Check ffmpeg
  if (!commandExists('ffmpeg')) {
    issues.push('ffmpeg is not installed. Install with: brew install ffmpeg');
  } else {
    console.log('  [OK] ffmpeg installed');
  }

  // Check ffprobe
  if (!commandExists('ffprobe')) {
    issues.push('ffprobe is not installed. Install with: brew install ffmpeg');
  } else {
    console.log('  [OK] ffprobe installed');
  }

  // Check Node version
  const nodeVersion = process.version.match(/^v(\d+)/)[1];
  if (parseInt(nodeVersion) < 18) {
    issues.push(`Node.js 18+ required. Current: ${process.version}`);
  } else {
    console.log(`  [OK] Node.js ${process.version}`);
  }

  // Check script files exist
  for (const [name, scriptPath] of Object.entries(CONFIG.scripts)) {
    if (!fs.existsSync(scriptPath)) {
      issues.push(`Script not found: ${name} (${scriptPath})`);
    } else {
      console.log(`  [OK] ${name} script exists`);
    }
  }

  // Check environment variables
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing environment variable: ${envVar}`);
    }
  }
  if (requiredEnvVars.every((v) => process.env[v])) {
    console.log('  [OK] Supabase environment variables set');
  }

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`  [OK] Created output directory: ${CONFIG.outputDir}`);
  } else {
    console.log(`  [OK] Output directory exists`);
  }

  // Ensure segments directory exists
  const segmentsDir = path.join(CONFIG.outputDir, 'segments');
  if (!fs.existsSync(segmentsDir)) {
    fs.mkdirSync(segmentsDir, { recursive: true });
  }

  // Ensure audio directory exists
  const audioDir = path.join(CONFIG.outputDir, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
    console.log(`  [NOTE] Audio directory created at: ${audioDir}`);
    console.log('         Place background.mp3 here for background music');
  }

  return issues;
}

// =============================================================================
// Main Pipeline
// =============================================================================

async function main() {
  const startTime = Date.now();

  console.log('\n' + '='.repeat(60));
  console.log('     DATA HUB DEMO VIDEO GENERATION');
  console.log('='.repeat(60));
  console.log('\nThis script will generate a complete demo video showcasing');
  console.log('Data Hub capabilities. The process takes approximately 5-10 minutes.\n');

  // Step 1: Check prerequisites
  console.log('STEP 1: Checking prerequisites');
  console.log('-'.repeat(40));

  const issues = await checkPrerequisites();

  if (issues.length > 0) {
    console.error('\nPrerequisite check failed:');
    issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  }

  console.log('\nAll prerequisites satisfied!\n');

  // Step 2: Check/start dev server
  console.log('STEP 2: Checking dev server');
  console.log('-'.repeat(40));

  let devServerProcess = null;

  if (await checkDevServer()) {
    console.log('  Dev server already running at', CONFIG.devServerUrl);
  } else {
    console.log('  Dev server not running. Starting...');
    console.log('  (Run `npm run dev` in another terminal for better control)\n');

    // Start dev server in background
    devServerProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'ignore',
      detached: true,
    });

    // Wait for it to be ready
    console.log('  Waiting for dev server to start...');
    const serverReady = await waitForDevServer();

    if (!serverReady) {
      console.error('  Failed to start dev server within timeout.');
      console.error('  Please start it manually: npm run dev');
      if (devServerProcess) {
        devServerProcess.kill();
      }
      process.exit(1);
    }

    console.log('  Dev server started successfully!');
  }

  try {
    // Step 3: Setup demo data
    console.log('\nSTEP 3: Setting up demo data');
    console.log('-'.repeat(40));
    await runScript(CONFIG.scripts.setup, 'Demo Data Setup');

    // Step 4: Record video segments
    console.log('\nSTEP 4: Recording video segments');
    console.log('-'.repeat(40));
    await runScript(CONFIG.scripts.record, 'Video Recording');

    // Step 5: Compile final video
    console.log('\nSTEP 5: Compiling final video');
    console.log('-'.repeat(40));
    await runScript(CONFIG.scripts.compile, 'Video Compilation');

    // Step 6: Validate outputs
    console.log('\nSTEP 6: Validating outputs');
    console.log('-'.repeat(40));

    const validationResults = validateOutputs();
    let allValid = true;

    for (const result of validationResults) {
      if (result.status === 'ok') {
        console.log(`  [OK] ${result.filename} (${result.size} MB)`);
      } else if (result.status === 'missing') {
        console.error(`  [FAIL] ${result.filename} - File not found`);
        allValid = false;
      } else if (result.status === 'too_small') {
        console.warn(`  [WARN] ${result.filename} - File too small (${result.size} MB)`);
      }
    }

    // Final summary
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(60));
    if (allValid) {
      console.log('     VIDEO GENERATION COMPLETE!');
    } else {
      console.log('     VIDEO GENERATION COMPLETED WITH WARNINGS');
    }
    console.log('='.repeat(60));
    console.log(`\nTotal time: ${elapsed} minutes`);
    console.log(`\nOutput files:`);
    console.log(`  ${path.join(CONFIG.outputDir, 'data-hub-demo.mp4')}`);
    console.log(`  ${path.join(CONFIG.outputDir, 'data-hub-demo.webm')}`);
    console.log(`  ${path.join(CONFIG.outputDir, 'demo-poster.jpg')}`);

    if (!fs.existsSync(path.join(CONFIG.outputDir, 'audio', 'background.mp3'))) {
      console.log(`\nNote: No background music was added.`);
      console.log(`To add music, place an MP3 file at:`);
      console.log(`  ${path.join(CONFIG.outputDir, 'audio', 'background.mp3')}`);
      console.log(`Then re-run: npm run video:compile`);
    }

    console.log(`\nThe video is ready to use on the landing page!`);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('VIDEO GENERATION FAILED');
    console.error('='.repeat(60));
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup: Kill dev server if we started it
    if (devServerProcess) {
      console.log('\nStopping dev server...');
      try {
        devServerProcess.kill('SIGTERM');
      } catch (err) {
        console.warn(`  Warning: Could not stop dev server: ${err.message}`);
      }
    }
  }
}

main();
