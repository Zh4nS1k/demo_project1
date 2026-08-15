module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Tests share one in-memory MongoDB — run serially in a single process
  // so the memory server and rate-limiter state behave predictably.
  maxWorkers: 1,
};
