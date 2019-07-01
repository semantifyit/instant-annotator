const webpack = require('webpack');
const path = require('path');

module.exports = [
    {
        name: 'bundle',
        mode: 'production',
        entry: './src/index.js',
        output: {
            filename: 'main.bundle.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'InstantAnnotation'
        },
        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            })
        ],
    },
    {
        name: 'standalone',
        mode: 'production',
        entry: './src/index.js',
        output: {
            filename: 'main.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'InstantAnnotation'
        },
        externals: {
            jquery: 'jQuery',
            moment: 'moment'
        },
        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            })
        ],
    }
];