const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {

	devtool: 'eval-source-map',
	//mode: 'production',
	mode: 'development',

	entry: './src/index.jsx',

	output: {
		path: __dirname + '/dist',
		filename: 'index.js',
	},

	externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
	},
	
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/default.css',
      ignoreOrder: false,
    }),
  ],

	module: {
		rules: [

			{
				test: /\.json$/,
				loader: "json-loader"
			},

			{
        test: /\.jsx?$/,
        exclude: /node_modules(?!\/openstad-component)/,
        use: {
          loader: "babel-loader"
        }
			},

      {
        test: /\.less$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader',
          'less-loader',
        ],
      },

		],
	},
	
}

