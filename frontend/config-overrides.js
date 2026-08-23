const { override, addWebpackBundleVisualizer, addBabelPlugin, addWebpackPlugin } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = override(
  // Add bundle analyzer
  process.env.ANALYZE && addWebpackBundleVisualizer({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: 'bundle-report.html'
  }),

  // Add compression plugin for production
  process.env.NODE_ENV === 'production' && addWebpackPlugin(
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    })
  ),

  // Add babel plugin for code splitting
  addBabelPlugin([
    '@babel/plugin-transform-runtime',
    {
      corejs: false,
      helpers: true,
      regenerator: true,
      useESModules: false,
    }
  ]),

  // Custom webpack configuration for optimization
  (config) => {
    // Optimize chunk splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          router: {
            test: /[\\/]node_modules[\\/]react-router(-dom)?[\\/]/,
            name: 'router',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Improve module resolution
    config.resolve = {
      ...config.resolve,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        ...config.resolve.alias,
        // Add aliases for easier imports
        '@components': 'src/components',
        '@hooks': 'src/hooks',
        '@utils': 'src/utils',
        '@styles': 'src/styles',
        '@assets': 'src/assets',
        '@context': 'src/context',
      },
    };

    // Add performance hints
    config.performance = {
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    };

    return config;
  }
);