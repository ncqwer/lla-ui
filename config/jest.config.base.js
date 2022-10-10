// const { TextEncoder, TextDecoder } = require('util');

// global.TextEncoder = TextEncoder;
// global.TextDecoder = TextDecoder;
// global.ArrayBuffer = ArrayBuffer;
// global.Uint8Array = Uint8Array;

module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // testEnvironment: 'jsdom',
  testEnvironment: '<rootDir>/../../config/jestEnvironment.js',
  testRegex: '(/__tests__/.*.(test|spec)).(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
