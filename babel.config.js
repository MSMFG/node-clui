module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				corejs: 3,
				useBuiltIns: 'usage',
			},
		],
	],
	plugins: [
		'@babel/plugin-proposal-optional-chaining',
		'@babel/plugin-transform-modules-commonjs',
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-proposal-private-methods',
	],
}
