const BuilderCli = require('@serenity-web-tools/builder-cli')

const ActionTypes = require('./ActionTypes')

module.exports = {
	...ActionTypes,
	...BuilderCli,
}
