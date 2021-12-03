const clone = require('clone')

const { ensureArray } = require('./helpers')

module.exports = class {
	constructor(cliCommands) {
		this.context = { _prompt_sequence: [], command: null }
		this.cliCommands = cliCommands
		this.finalOptions = []
		this.promptQueue = []
		this.history = [
			{
				context: clone(this.context),
				finalOptions: clone(this.finalOptions),
				cliCommands: clone(this.cliCommands),
				promptQueue: clone(this.promptQueue),
			},
		]
	}

	registerAnswer(option, answer, askedUser = true) {
		this.history.push({
			askedUser,
			option,
			context: clone(this.context),
			finalOptions: clone(this.finalOptions),
			cliCommands: clone(this.cliCommands),
			promptQueue: clone(this.promptQueue),
		})

		this.context._prompt_sequence.push(answer)
		if (option.name) {
			this.context[option.name] = answer
		}
		if (option.commandName) {
			this.context.command = option.commandName
		}
	}

	rollbackHistory() {
		if (this.history.length === 0) {
			return null
		}

		const { askedUser, option, context, finalOptions, cliCommands, promptQueue } = this.history.pop()

		this.context = context
		this.finalOptions = finalOptions
		this.cliCommands = cliCommands
		this.promptQueue = promptQueue

		if (askedUser) {
			return option
		} else {
			return this.rollbackHistory()
		}
	}

	hasPromptsInQueue() {
		return this.promptQueue.length > 0
	}

	addPromptToQueue(option) {
		const options = ensureArray(option)
		options.forEach((option) => this.promptQueue.push(option))
	}

	getNextPromptFromQueue() {
		return this.promptQueue.shift()
	}

	addFinalOption(option) {
		this.finalOptions.push(option)
	}

	getPromptSequence() {
		return this.context._prompt_sequence
	}

	getFirstCommand() {
		return this.cliCommands.length > 0 ? this.cliCommands[0] : null
	}

	getRemainingCommands() {
		const commands = []
		for (let i = 1; i < this.cliCommands.length; i++) {
			commands.push(this.cliCommands[i])
		}
		return commands
	}
}
