import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTE_PUBLIC_PATH = process.env.REMOTE_PUBLIC_PATH ?? 'http://localhost:3001/';

export default defineConfig({
  entry: './src/index.ts',
  target: 'async-node',
  output: {
    path: path.resolve(__dirname, 'dist-node'),
    publicPath: REMOTE_PUBLIC_PATH,
    clean: true,
    library: {
      type: 'commonjs-module',
    },
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
      name: 'remote',
      filename: 'remoteEntry.js',
      library: { type: 'commonjs-module' },
      exposes: {
        './rpc-contract': './src/rpc-contract.ts',
        './rpc-runtime': './src/rpc-runtime.ts',
      },
      dts: {
        generateTypes: {
          generateAPITypes: true,
        },
      },
    }),
  ],
});
