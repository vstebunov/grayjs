module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: "./src/index.ts",
    output: { filename: "index.js" },
    resolve: { extensions: [".ts", ".tsx",  ".js", ".css"] },
    module: {
        rules: [
            { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
        ]
    },
    devServer: {
        static: 'asset',
        port: 4500
    }
};
