const { prompt } = require('inquirer'),
	{ red } = require('colors')

const { getPromptText } = require('../helpers')

module.exports = class Confirm {
	constructor(option) {
		this.option = option
	}

	async execute(defaultValue, context) {
		this.prompt = prompt({
			type: 'confirm',
			name: 'result',
			message: getPromptText(this.option, context),
			default: defaultValue,
		})
		const { result } = await this.prompt

		return result
	}

	close() {
		this.prompt.ui.close()
		// eslint-disable-next-line no-console
		console.log(red.bold('x'))
	}

	getTypeOfValue() {
		return 'boolean'
	}
}
