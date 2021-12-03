const util = require('util')
const { prompt } = require('inquirer'),
	async = require('async'),
	{ red } = require('colors')

const { getPromptText, getValue, getChoicesFromOptions, ensureArray } = require('../helpers')

module.exports = class List {
	constructor(option) {
		this.option = option
		this.commandName = option.commandName
		this.options = option.options
		this.multiple = option.multiple
		this.validate = option.validate
		this.next = option.next
	}

	async execute(defaultValue, context) {
		const choices = await getChoicesFromOptions(this.options, context)
		if (choices.length === 0) {
			throw new Error(`No options specified, options array is empty.\n${util.inspect(this.option, false, 5, true)}`)
		}
		this.prompt = prompt({
			type: this.multiple ? 'checkbox' : 'rawlist',
			name: 'result',
			message: getPromptText(this.option, context),
			pageSize: 20,
			default: defaultValue,
			validate: this.validate,
			choices,
		})
		const { result } = await this.prompt
		return result
	}

	close() {
		this.prompt.ui.close()
		// eslint-disable-next-line no-console
		console.log(red.bold('x'))
	}

	async getNextOptions(answer) {
		return await this.getSelectedItemsNextOptions(answer)
	}

	async getSelectedItemsNextOptions(answer) {
		let resolvedOptions = typeof this.options === 'function' ? await this.options() : this.options
		const filtered = resolvedOptions.filter((option) => ensureArray(answer).indexOf(getValue(option)) >= 0)
		return filtered
	}

	async getInitialValue(valueResolver, contextManager, autoFillFilter) {
		let resolvedOptions = typeof this.options === 'function' ? await this.options() : this.options

		let subOptionValues = (
			await async.map(resolvedOptions, async (subOption) => {
				let subOptionValue = await valueResolver(subOption, autoFillFilter)
				if (subOption.commandName) {
					subOptionValue = subOption.commandName === contextManager.getFirstCommand() && (!autoFillFilter || autoFillFilter('command'))
				}
				return subOptionValue ? getValue(subOption) : null
			})
		).filter((v) => v)

		let initialValue = null
		if (subOptionValues.length > 0) {
			initialValue = this.multiple ? subOptionValues : subOptionValues[0]
		} else if (this.commandName && contextManager.getFirstCommand() === this.commandName) {
			const remainingCommands = contextManager.getRemainingCommands()
			if (remainingCommands.length > 0) {
				initialValue = this.multiple ? remainingCommands : remainingCommands[0]
			}
		}
		return initialValue
	}

	getTypeOfValue() {
		return this.multiple ? 'array' : 'string'
	}
}
