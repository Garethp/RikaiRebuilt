const path = require('path');
const WebExtWebpackPlugin = require('web-ext-webpack-plugin');

module.exports = {
    // No need for uglification etc.
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    entry: {
        'content': path.resolve(__dirname, './src/content/index.js'),
        'background': path.resolve(__dirname, './src/background.js'),
        'options': path.resolve(__dirname, './src/options/options.js'),
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