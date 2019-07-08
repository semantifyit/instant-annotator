const webpack = require('webpack');
const path = require('path');

module.exports = [

    {
        name: 'bundle',
        mode: 'production',
        entry: './src/index.js',
        output: {
            filename: 'instantAnnotation.bundle.js',
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
            filename: 'instantAnnotation.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'InstantAnnotation'
        },
        externals: {
            jquery: 'jQuery',
            moment: 'moment',
            snackbarjs: '0', // string '0', since no named export; import * as foo from 'snackbarjs'; - foo === 0
            'eonasdan-bootstrap-datetimepicker': '0',
            bootstrap: '0',
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
