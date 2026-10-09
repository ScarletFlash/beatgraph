import { resolve } from 'path';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';

export default defineConfig({
  context: import.meta.dirname,
  target: 'node24',
  entry: {
    main: './src/main.mts'
  },
  output: {
    path: resolve(import.meta.dirname, 'dist', 'rspack'),
    clean: true,
    module: true,
    chunkFormat: 'module',
    chunkLoading: 'import'
  },
  resolve: {
    extensions: ['...', '.mts']
  },
  module: {
    parser: {
      javascript: {
        importMeta: false
      }
    },
    rules: [
      {
        test: /\.mts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          detectSyntax: 'auto'
        }
      }
    ]
  },
  plugins: [
    new rspack.EnvironmentPlugin(['npm_package_name']),
    new rspack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
      entryOnly: true
    })
  ]
});
