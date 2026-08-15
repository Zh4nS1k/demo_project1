// Runs before each test worker starts (setupFiles) — before any test file is loaded.
// Tests must never depend on the developer's real .env.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-at-least-32-chars-long';
process.env.JWT_EXPIRES_IN = '1h';
