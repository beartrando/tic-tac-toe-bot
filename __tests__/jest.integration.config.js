const path = require('path');

module.exports = {
    ...require('../jest.config.js'),
    rootDir: path.resolve(__dirname, '..'),
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: ['<rootDir>/__tests__/integration/**/*.spec.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
};
