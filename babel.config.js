module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
};
// this file was once used for jest. Since we're now using ts-jest, we don't need Babel for transpilation 
// I'm keeping this here for reference though