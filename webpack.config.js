const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

// Load environment variables from .env file
require('dotenv').config();

const adsenseClient = process.env.ADSENSE_CLIENT || '';
const adsenseHomeSlot = process.env.ADSENSE_HOME_SLOT || '';

class AdsTxtPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('AdsTxtPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'AdsTxtPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          if (!adsenseClient) {
            return;
          }

          const publisherId = adsenseClient.replace(/^ca-pub-/, '');
          const content = `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`;
          compilation.emitAsset('ads.txt', new webpack.sources.RawSource(content));
        }
      );
    });
  }
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      editor: './src/index.js',
      landing: './src/landing.js'
    },
    output: {
      path: path.resolve(__dirname, 'public'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]'
          }
        },
        {
          test: /\.svg$/i,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]'
          }
        },
      ],
    },
    plugins: [
      // Editor page (main app) -> /editor.html
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'editor.html',
        chunks: ['editor'],
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: false,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      // Landing page -> /index.html
      new HtmlWebpackPlugin({
        template: './src/landing.html',
        filename: 'index.html',
        chunks: ['landing'],
        minify: true,
        templateParameters: {
          adsenseClient,
          adsenseHomeSlot,
        },
      }),
      // Extract CSS for production builds
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: isProduction ? 'styles.[contenthash].css' : 'styles.css',
      })] : []),
      // Inject PUBLIC env vars at build time. OPENAI_API_KEY is intentionally
      // NOT injected — the client now goes through /api/ai/* on the server.
      new webpack.DefinePlugin({
        'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(process.env.EMAILJS_PUBLIC_KEY),
        'process.env.EMAILJS_SERVICE_ID': JSON.stringify(process.env.EMAILJS_SERVICE_ID),
        'process.env.EMAILJS_TEMPLATE_ID': JSON.stringify(process.env.EMAILJS_TEMPLATE_ID),
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
        'process.env.ADSENSE_CLIENT': JSON.stringify(adsenseClient),
        'process.env.ADSENSE_HOME_SLOT': JSON.stringify(adsenseHomeSlot),
      }),
      new AdsTxtPlugin(),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3001,
    },
  };
}; 