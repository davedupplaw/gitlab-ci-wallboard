const root = require('app-root-path').path;
const CopyWebpackPlugin = require('copy-webpack-plugin');

// --------------------------------------------------------------------------------------------------------
// https://stackoverflow.com/questions/43948171/building-a-react-app-with-socket-io-and-webpack-doesnt-work
const fs = require('fs');
const nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });
// --------------------------------------------------------------------------------------------------------


module.exports = {
    mode: 'development',
    entry: `${root}/launcher.ts`,
    target: 'node',
    externals: nodeModules,
    output: {
        filename: 'compiled.js', // output file
        path: `${root}/build`,
        libraryTarget: "commonjs"
    },
    devtool: 'cheap-module-source-map',
    resolve: {
        // Add in `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
        modules: [
            `${root}/node_modules`,
            'node_modules'
        ]
    },
    module: {
        rules: [{
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            test: /\.tsx?$/,
            use: [
                {
                    loader: 'ts-loader',
                }
            ]
        }]
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: 'config',
            to: 'config'
        }])
    ]
};
