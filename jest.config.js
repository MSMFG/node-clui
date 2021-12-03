const merge = require('deepmerge')

const jestConfig = require('@serenity-web-tools/config-root').jest

module.exports = merge(jestConfig, {
	collectCoverageFrom: ['!src/pages/*', '!src/stories/*'],
	coverageDirectory: '../../../coverage/app-dashboard',
})
