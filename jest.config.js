module.exports = {
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleDirectories: ['node_modules', 'bower_components', 'shared'],
  rootDir: '',
  "roots": [
    "<rootDir>/src",
    "<rootDir>/test"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
