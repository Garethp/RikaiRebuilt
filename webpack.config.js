const path = require('path');
const WebExtWebpackPlugin = require('@ianwalter/web-ext-webpack-plugin');

module.exports = {
    // No need for uglification etc.
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    entry: {
        'content': path.resolve(__dirname, './src/content/index.ts'),
        'background': path.resolve(__dirname, './src/background.ts'),
        'options': path.resolve(__dirname, './src/options/options.js'),
        'vn-hook': path.resolve(__dirname, './src/vn-hook/index.ts')
    },
    plugins: [
        new WebExtWebpackPlugin({
            browserConsole: true,
            startUrl: ['https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji'],
            sourceDir: path.resolve(__dirname, './'),
        }),
    ],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
};
