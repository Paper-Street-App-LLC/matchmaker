# Testing Guide

This guide covers testing practices for the Matchmaker system.

## Overview

We use **Bun's built-in test runner**, which provides a Jest-compatible API with excellent TypeScript support and blazing-fast execution.

## Test Structure

### Backend Tests (`backend/tests/`)
```
tests/
├── setup.ts           # Global test configuration
├── index.test.ts      # API endpoint tests
└── lib/
    └── utils.test.ts  # Utility function tests
```

### MCP Server Tests (`mcp-server/tests/`)
```
tests/
├── setup.ts              # Global test configuration
└── lib/
    └── validators.test.ts # Validation logic tests
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, test, expect } from 'bun:test';

describe('Feature Name', () => {
  test('should do something', () => {
    let result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Testing Hono Routes

```typescript
import { describe, test, expect } from 'bun:test';
import { z } from 'zod';
import app from '../src/index';

let responseSchema = z.object({
  key: z.string(),
});

describe('GET /endpoint', () => {
  test('should return expected response', async () => {
    let req = new Request('http://localhost/endpoint');
    let res = await app.fetch(req);

    expect(res.status).toBe(200);
    let json = await res.json();
    let data = responseSchema.parse(json);
    expect(data.key).toBe('value');
  });
});
```

### Testing with Zod Validation

Always validate API responses and data with Zod schemas:

```typescript
import { z } from 'zod';

// Define schema
let userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

// In tests
let json = await res.json();
let data = userSchema.parse(json);  // Throws if invalid
expect(data.name).toBe('expected');
```

### Testing with Setup/Teardown

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

describe('Database Operations', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should perform operation', () => {
    // Test code
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
bun test

# Watch mode (re-run on changes)
bun test --watch

# With coverage
bun test --coverage

# Run specific file
bun test path/to/file.test.ts
```

### Test Output

Bun provides colorful, detailed output:
- ✓ Passing tests (green)
- ✗ Failing tests (red)
- Execution time for each test
- Coverage percentages (when enabled)

## Best Practices

### 1. Test Organization

- **One describe block per feature/function**
- **Multiple test cases per describe block**
- **Use descriptive test names** starting with "should"

```typescript
describe('formatName', () => {
  test('should convert to title case', () => { /* ... */ });
  test('should handle empty strings', () => { /* ... */ });
  test('should handle single words', () => { /* ... */ });
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
test('should calculate total correctly', () => {
  // Arrange
  let items = [10, 20, 30];

  // Act
  let result = calculateTotal(items);

  // Assert
  expect(result).toBe(60);
});
```

### 3. Use let for Variables

Follow project conventions:
- Use `let` for all mutable variables in tests
- Only use `const` for true primitive constants

```typescript
// Good
let req = new Request('http://localhost/');
let res = await app.fetch(req);
let json = await res.json();

// Bad
const req = new Request('http://localhost/');
```

### 4. Always Validate with Zod

Never use `any` or cast types - always validate with Zod:

```typescript
// Good
let responseSchema = z.object({ message: z.string() });
let json = await res.json();
let data = responseSchema.parse(json);

// Bad
let json = await res.json() as { message: string };
```

### 5. Test Edge Cases

Always test:
- Empty inputs
- Invalid inputs
- Boundary conditions
- Error scenarios

### 6. Avoid Test Interdependence

Each test should be independent:

```typescript
// Bad - Tests depend on each other
let sharedState: string;
test('test 1', () => { sharedState = 'value'; });
test('test 2', () => { expect(sharedState).toBe('value'); });

// Good - Tests are independent
test('test 1', () => {
  let state = 'value';
  expect(state).toBe('value');
});
```

## Code Style in Tests

### Variable Declarations
- Use `let` for all variables (including schemas, requests, responses)
- No `const` except for true primitive constants

### Zod Schemas
- Always use Zod to validate API responses
- Define schemas at the top of describe blocks
- Use camelCase for schema names: `userSchema`, `responseSchema`

### Example

```typescript
import { describe, test, expect } from 'bun:test';
import { z } from 'zod';
import app from '../src/index';

let userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

describe('Users API', () => {
  test('should create user', async () => {
    let req = new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice' }),
    });
    let res = await app.fetch(req);

    expect(res.status).toBe(201);

    let json = await res.json();
    let data = userSchema.parse(json);
    expect(data.name).toBe('Alice');
  });
});
```

## Coverage Goals

- **Aim for 80%+ coverage** on business logic
- **100% coverage** on critical paths (auth, validation)
- Don't chase 100% everywhere - focus on value

### Viewing Coverage

```bash
bun test --coverage
```

Output shows:
- File-by-file coverage percentages
- Lines covered/uncovered
- Functions covered/uncovered

## Continuous Integration

Tests run automatically on:
- Every push to `main`
- Every pull request

See `.github/workflows/test.yml` for CI configuration.

### Local Pre-commit Testing

Before committing, run:
```bash
cd backend && bun test && cd ../mcp-server && bun test
```

## Troubleshooting

### Tests Not Found

Ensure test files:
- End with `.test.ts` or `.spec.ts`
- Are in `tests/` directory
- Are included in `tsconfig.json`

### Import Errors

Bun uses `bun:test` for test utilities:
```typescript
import { describe, test, expect } from 'bun:test'; // ✓
import { describe, test, expect } from '@jest/globals'; // ✗
```

### Type Errors

Always validate with Zod instead of casting:
```typescript
// Good
let schema = z.object({ key: z.string() });
let data = schema.parse(json);

// Bad
let data = json as { key: string };
```

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Zod Documentation](https://zod.dev)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
