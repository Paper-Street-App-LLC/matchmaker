import { beforeAll, afterAll } from 'bun:test';

// Global test setup
beforeAll(() => {
  console.log('Running MCP server test suite');
});

afterAll(() => {
  console.log('MCP server tests completed');
});
