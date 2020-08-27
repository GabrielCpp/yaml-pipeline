module.exports = {
    verbose: true,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    moduleDirectories: ['node_modules', 'bower_components', 'shared'],
    testEnvironment: 'node',
    rootDir: '',
    "roots": [
        "<rootDir>/src",
        "<rootDir>/test"
    ],
    setupFiles: ['<rootDir>/test/setup.ts'],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};
