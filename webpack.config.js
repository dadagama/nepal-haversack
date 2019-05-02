const path = require('path');
//  const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: {
    'errors': path.resolve( __dirname, './dist/commonjs/errors/index.js' ),
    "triggers": path.resolve( __dirname, "./dist/commonjs/triggers/index.js" ),
    "promises": path.resolve( __dirname, "./dist/commonjs/promises/index.js" ),
    "locator": path.resolve( __dirname, "./dist/commonjs/locator/index.js" ),
    "utility": path.resolve( __dirname, "./dist/commonjs/utility/index.js" ),
    "schema-validator": path.resolve( __dirname, "./dist/commonjs/schema-validator/index.js" )
  },
  output: {
    path: path.resolve(__dirname, './'),
    filename: '[name].js',
    library: '@al/haversack/[name]',
    libraryTarget: 'umd', // supports commonjs, amd and web browsers
    globalObject: 'this'
  },
  plugins: [
//    new PeerDepsExternalsPlugin()
  ]
};
