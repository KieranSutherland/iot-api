module.exports = {
    moduleFileExtensions: [
        'ts',
        'js'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': [ 'ts-jest', { isolatedModules: !!process.env.CI, tsconfig: 'tsconfig.json' } ]
    },
    testMatch: [
        '<rootDir>/src/**/*.test.(ts|js)'
    ],
    testEnvironment: 'node'
};
