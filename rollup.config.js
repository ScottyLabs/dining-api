// rollup.config.js
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/server.ts',
  output: {
    dir: 'dist',
    format: 'es', // esmodule syntax, because who uses commonjs these days?
    preserveModules: true, // so we get proper stacktraces (we don't need bundling anyways, since we aren't serving these files over the wire)
  },
  plugins: [typescript()]
};