module.exports = {
	root: true,
	parserOptions: {
		parser: 'babel-eslint',
		sourceType: 'module',
		ecmaVersion: 2020,
		ecmaFeatures: {
			impliedStrict: true,
		},
	},
	env: {
		node: true,
		es6: true,
	},
	extends: [
		'plugin:json/recommended',
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:vue/recommended',
		'plugin:import/errors',
		'plugin:promise/recommended',
		'prettier',
	],
	ignorePatterns: ['node_modules', 'dist', 'coverage', '.history', '.vscode'],
	overrides: [
		{
			files: ['**/*.spec.js'],
			env: { jest: true },
			rules: {
				'import/namespace': 'off',
			},
		},
	],
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
		'array-bracket-spacing': 'off',
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				exports: 'always-multiline',
				functions: 'never',
				imports: 'always-multiline',
				objects: 'always-multiline',
			},
		],
		'quote-props': ['error', 'consistent'],
		'no-var': 'error',
		'vue/html-closing-bracket-newline': 'warn',
		'import/namespace': [
			2,
			{
				allowComputed: true,
			},
		],
		'import/no-unresolved': [
			'error',
			{
				ignore: ['\\.svg\\?inline'],
			},
		],
		'promise/prefer-await-to-then': 'error',
		'promise/prefer-await-to-callbacks': 'error',
		'prettier/prettier': [
			'error',
			{
				semi: false,
				singleQuote: true,
				printWidth: 160,
				quoteProps: 'consistent',
				useTabs: true,
			},
		],
		'quotes': ['error', 'single', { avoidEscape: true }],
	},
}
