import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced';

export default defineConfig({
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    clean: true,
  },
  devServer: {
    port: 3001,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'remote',
      filename: 'remoteEntry.js',
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
