# Express Route Patterns

## File Structure

```javascript
import { Router } from 'express';
import { sheetsService } from '../services/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Constants for validation
const VALID_STATUSES = ['active', 'inactive', 'onboarding'];

// Validation helper
function validateData(data, isUpdate = false) {
  const errors = [];
  // ... validation logic
  return errors;
}

// Routes...

export default router;
```

## GET - List All

```javascript
router.get('/', async (_req, res, next) => {
  try {
    const items = await service.getAll();
    res.json({ items });
  } catch (error) {
    next(error);
  }
});
```

## GET - Single Item

```javascript
router.get('/:id', async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);
    if (!item) {
      throw new AppError('Item not found', 404);
    }
    res.json({ item });
  } catch (error) {
    next(error);
  }
});
```

## POST - Create

```javascript
router.post('/', async (req, res, next) => {
  try {
    const { field1, field2 } = req.body;

    const validationErrors = validateData({ field1, field2 });
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const item = await service.create({
      field1: field1.trim(),
      field2: field2?.trim() || '',
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});
```

## PUT - Update

```javascript
router.put('/:id', async (req, res, next) => {
  try {
    const { field1, field2 } = req.body;

    const validationErrors = validateData({ field1, field2 }, true);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(', '), 400);
    }

    const item = await service.update(req.params.id, {
      field1: field1?.trim(),
      field2: field2?.trim(),
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});
```

## DELETE

```javascript
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) {
      throw new AppError('Item not found', 404);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
```

## Nested Resources

```javascript
// GET /api/clients/:id/sources
router.get('/:id/sources', async (req, res, next) => {
  try {
    const sources = await service.getClientSources(req.params.id);
    res.json({ sources });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients/:id/sources
router.post('/:id/sources', async (req, res, next) => {
  try {
    const source = await service.createSource(req.params.id, req.body);
    res.status(201).json({ source });
  } catch (error) {
    next(error);
  }
});
```

## Validation Patterns

### Required Field

```javascript
if (!field?.trim()) {
  errors.push('Field is required');
}
```

### Length Validation

```javascript
if (field && field.length > 100) {
  errors.push('Field must be less than 100 characters');
}
```

### Enum Validation

```javascript
const VALID_VALUES = ['option1', 'option2', 'option3'];

if (field && !VALID_VALUES.includes(field)) {
  errors.push(`Invalid value. Must be one of: ${VALID_VALUES.join(', ')}`);
}
```

### Email Validation

```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (email && !EMAIL_REGEX.test(email)) {
  errors.push('Invalid email format');
}
```

### UUID Validation

```javascript
import { isValidUUID } from '../services/validators.js';

if (!isValidUUID(req.params.id)) {
  throw new AppError('Invalid ID format', 400);
}
```

## Response Formats

### Success Responses

```javascript
// Single item
res.json({ client });

// List
res.json({ clients });

// Created
res.status(201).json({ client });

// Deleted
res.json({ success: true });
```

### Error Responses

```javascript
// Handled by errorHandler middleware
{
  error: 'Error message',
  status: 400,
  requestId: 'uuid'
}
```
