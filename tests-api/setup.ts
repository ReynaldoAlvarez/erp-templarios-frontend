import { beforeAll, afterAll, afterEach } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/erp_templarios_test?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.API_PREFIX = '/api/v1';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
});

// Global teardown
afterAll(async () => {
  console.log('🧪 Test suite completed.');
});

// Cleanup after each test
afterEach(async () => {
  // Reset any mocks if needed
});
