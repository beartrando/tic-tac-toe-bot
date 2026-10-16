module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    coverageDirectory: 'coverage',
    testMatch: ['**/*.spec.ts'],
    compilerOptions: {
        "types": ["jest", "node"],
        "isolatedModules": true
    }
};
