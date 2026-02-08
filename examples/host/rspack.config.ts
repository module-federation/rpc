import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced';

export default defineConfig({
  entry: './src/index.ts',
  output: {
    publicPath: 'auto',
    clean: true,
  },
  devServer: {
    port: 3000,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remote: 'remote@http://localhost:3001/remoteEntry.js',
      },
      dts: {
        consumeTypes: true,
      },
    }),
  ],
});
