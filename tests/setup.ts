// Test setup
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
    process.env.NODE_ENV = 'test';
});
