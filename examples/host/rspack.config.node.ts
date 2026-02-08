import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export default defineConfig({
  entry: './src/index.node.ts',
  target: 'async-node',
  output: {
    path: path.resolve(__dirname, 'dist-node'),
    clean: true,
    library: {
      type: 'commonjs-module',
    },
    filename: '[name].cjs',
    chunkFilename: '[name].cjs',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
            target: 'es2020',
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remote: 'remote@http://localhost:3001/remoteEntry.js',
      },
      remoteType: 'script',
      runtimePlugins: [require.resolve('@module-federation/node/runtimePlugin')],
      library: { type: 'commonjs-module' },
      experiments: {
        asyncStartup: true,
      },
      dts: {
        consumeTypes: true,
      },
    }),
  ],
});
