import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';

const REMOTE_PUBLIC_PATH = process.env.REMOTE_PUBLIC_PATH ?? 'http://localhost:3001/';

export default defineConfig({
  entry: './src/index.ts',
  output: {
    publicPath: REMOTE_PUBLIC_PATH,
    clean: true,
  },
  devServer: {
    port: 3001,
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
      experiments: {
        asyncStartup: true,
      },
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
