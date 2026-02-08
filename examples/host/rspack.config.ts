import { defineConfig } from '@rspack/cli';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import HtmlRspackPlugin from '@rspack/plugin-html';

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
      experiments: {
        asyncStartup: true,
      },
      dts: {
        consumeTypes: true,
      },
    }),
    new HtmlRspackPlugin({
      template: './public/index.html',
    }),
  ],
});
