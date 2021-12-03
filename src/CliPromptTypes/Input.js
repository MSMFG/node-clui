const { prompt } = require('inquirer'),
	{ red } = require('colors')

const { getPromptText } = require('../helpers')

module.exports = class Input {
	constructor(option) {
		this.option = option
		this.format = option.format ? option.format.toLowerCase() : 'string'
	}

	async execute(defaultValue, context) {
		this.prompt = prompt({
			type: this.format === 'number' ? 'number' : 'input',
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
		return this.format === 'number' ? 'number' : 'string'
	}
}
