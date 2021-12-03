const fs = require('fs').promises,
	path = require('path')

const LAST_COMMAND_FILE = 'go.last-command.tmp'
module.exports = class Action {
	constructor(option, folderPath) {
		this.option = option
		this.folderPath = folderPath
		this.hasFinalEffect = true
	}

	async execute(context) {
		let commands = this.option.cmd
		if (typeof commands === 'function') {
			commands = commands(context)
		}
		commands = Array.isArray(commands) ? commands.join('\n') : commands

		const lastCommandFileName = this.option.output || LAST_COMMAND_FILE
		const lastCommandFilePath = path.resolve(this.folderPath, lastCommandFileName)
		await fs.writeFile(lastCommandFilePath, commands)

		return {}
	}
}
