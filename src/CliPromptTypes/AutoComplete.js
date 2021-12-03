const inquirer = require('inquirer'),
	{ prompt } = inquirer,
	{ red } = require('colors')

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

const { getPromptText, debounceAsyncFunction, getChoicesFromOptions } = require('../helpers')
module.exports = class AutoComplete {
	constructor(option) {
		this.option = option
		this.validate = option.validate
	}

	async execute(defaultValue, context) {
		if (!this.option.source) {
			throw new Error(`You must specify a 'source' property on the AutoComplete to provide suggestions.\n${JSON.stringify(this.option, null, 2)}`)
		}

		const debounceTimeout = this.option.debounceTimeout || 800
		const debouncedSource = debounceAsyncFunction(this.option.source, debounceTimeout)
		this.prompt = prompt({
			type: 'autocomplete',
			name: 'result',
			message: getPromptText(this.option, context),
			pageSize: 20,
			searchText: this.option.searchText,
			emptyText: this.option.emptyText,
			default: defaultValue,
			suggestOnly: false,
			validate: this.validate,
			source: async (previous, text) => {
				let suggestions
				try {
					suggestions = await debouncedSource(previous, text)
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error(`\n${red.bold(e)}`)
					process.exit(1)
				}
				suggestions = await getChoicesFromOptions(suggestions || [], context)
				const filteredSuggestions = suggestions.filter((s) => (typeof s === 'string' ? s : s.value || text).indexOf(text) >= 0)
				return filteredSuggestions.length > 0 ? filteredSuggestions : defaultValue ? [defaultValue] : []
			},
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
