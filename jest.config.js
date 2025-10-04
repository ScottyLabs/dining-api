/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", { diagnostics: { warnOnly: true } }],
  },
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/jest.setup.js']
};