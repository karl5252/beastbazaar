module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
    globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.vitest,
    },
	extends: 'eslint:recommended',
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {},
}
