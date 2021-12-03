const util = require('util')

const { prompt } = require('inquirer'),
	{ red } = require('colors')

const { getPromptText, getChoicesFromOptions } = require('../helpers')

module.exports = class Expand {
	constructor(option) {
		this.option = option
		this.options = option.options || [{ text: 'yes' }, { text: 'no' }]
	}

	async execute(defaultValue, context) {
		const choices = (await getChoicesFromOptions(this.options, context)).map(({ name, value }) => ({ name, value, key: name.slice(0, 1) }))
		if (choices.length === 0) {
			throw new Error(`No options specified, options array is empty.\n${util.inspect(this.option, false, 5, true)}`)
		}

		this.prompt = prompt({
			type: 'expand',
			name: 'result',
			message: getPromptText(this.option, context),
			choices,
			default: defaultValue ? choices.findIndex(({ value }) => value === defaultValue) : null,
		})
		const { result } = await this.prompt

		return result
	}

	close() {
		this.prompt.ui.close()
		// eslint-disable-next-line no-console
		console.log(red.bold('x'))
	}
}
