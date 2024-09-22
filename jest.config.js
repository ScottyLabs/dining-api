/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", { diagnostics: { warnOnly: true } }],
  },
  moduleDirectories: ['node_modules', 'src']
};