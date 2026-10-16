module.exports = {
    ...require('../jest.config.js'),
    rootDir: '..',
    roots: ['<rootDir>/__tests__'],
    testMatch: ['<rootDir>/__tests__/integration/**/*.spec.ts'],
};
