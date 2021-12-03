/* eslint-disable no-console */
const { green, bold, cyan } = require('colors')

const PROMPT_TYPES = require('./CliPromptTypes')
const ARGS_SOURCE = {
	CLI: 'cli',
	CONFIG_FILE: 'configfile',
	DEFAULT: 'default',
}

const { ensureArray, createExternalPromiseResolver, getPromptText, getPromptTypeFromOption } = require('./helpers')
module.exports = class {
	constructor(contextManager, config) {
		this.contextManager = contextManager
		this.config = config
	}

	async show(options) {
		this.contextManager.addPromptToQueue(options)
		while (this.contextManager.hasPromptsInQueue()) {
			await this.showNextOption()
		}
		return { finalOptions: this.contextManager.finalOptions, answers: this.contextManager.context }
	}

	async showNextOption() {
		if (this.contextManager.hasPromptsInQueue()) {
			const option = this.contextManager.getNextPromptFromQueue()
			const hasUserCancelled = await this.showOption(option)
			if (hasUserCancelled) {
				const previousOption = this.contextManager.rollbackHistory()
				if (previousOption) {
					this.contextManager.addPromptToQueue(previousOption)
				}
			}
		}
	}

	async showOption(option) {
		const PromptType = getPromptTypeFromOption(PROMPT_TYPES, option)
		const initialValue = await this.getInitialValueForOption(option)
		if (PromptType) {
			const prompt = new PromptType(option)
			let hasUserCancelled

			if (this.config.autoFill) {
				const autoFillValue = await this.getInitialValueForOption(option, this.autoFillFilter.bind(this))
				if (autoFillValue) {
					hasUserCancelled = await this.autoFillAnswer(option, prompt, autoFillValue)
				} else {
					hasUserCancelled = await this.askAnswer(option, prompt, initialValue)
				}
			} else {
				hasUserCancelled = await this.askAnswer(option, prompt, initialValue)
			}
			return hasUserCancelled
		} else {
			return await this.registerAnswerForNonePrompt(option, initialValue)
		}
	}

	autoFillFilter(configName) {
		const isFromSource = {
			cli: this.config._args_sources[configName] === ARGS_SOURCE.CLI,
			configfile: this.config._args_sources[configName] === ARGS_SOURCE.CONFIG_FILE,
		}

		switch (this.config.autoFill) {
			case ARGS_SOURCE.CLI:
				return isFromSource.cli
			case ARGS_SOURCE.CONFIG_FILE:
				return isFromSource.cli || isFromSource.configfile
			case true:
				return true
			default:
				return false
		}
	}

	async registerAnswerForNonePrompt(option, initialValue) {
		let answer
		const value = typeof option.value === 'function' ? option.value(this.contextManager.context) : option.value
		if (typeof value !== 'undefined') {
			answer = value
		} else if (typeof initialValue !== 'undefined') {
			answer = initialValue
		} else if (option.commandName) {
			answer = option.commandName
		} else {
			answer = true
		}
		this.contextManager.registerAnswer(option, answer, false)
		this.contextManager.addFinalOption(option)

		return false
	}

	async autoFillAnswer(option, prompt, initialValue) {
		if (!initialValue && prompt.getAutoFillAnswer) {
			initialValue = await prompt.getInitialValue(initialValue)
		}
		if (!initialValue) {
			throw new Error("You must supply an 'initialValue' to 'autoFillAnswer'")
		}
		const promptText = getPromptText(option, this.contextManager.context)
		if (promptText) {
			console.log(`${green('?')} ${bold(promptText)} ${cyan(initialValue)}`)
		}
		this.contextManager.registerAnswer(option, initialValue, false)
		await this.processNextOptions(option, prompt, initialValue)
		return false
	}

	async askAnswer(option, prompt, initialValue) {
		if (!process.stdin.isTTY) {
			throw new Error(`Cannot ask user for answer as stdin is not TTY : \n${JSON.stringify(option, null, 2)}`)
		}

		const answerPromise = prompt.execute(initialValue, this.contextManager.context)

		const { resolver, promise: escapeKeyPressPromise } = createExternalPromiseResolver()
		const keyPressHandler = this.createKeyPressHandler(({ name }) => {
			if (name === 'escape') {
				prompt.close()
				resolver(true)
				return true
			} else {
				return false
			}
		})

		return await Promise.race([
			escapeKeyPressPromise,
			(async () => {
				const answer = await answerPromise
				keyPressHandler.stop()
				this.contextManager.registerAnswer(option, answer, true)
				await this.processNextOptions(option, prompt, answer)
				return false
			})(),
		])
	}

	createKeyPressHandler(handleKeyPress) {
		const handler = (str, key) => {
			const isInterrupting = handleKeyPress(key, str)
			if (!isInterrupting) {
				process.stdin.once('keypress', handler)
			}
		}
		handler.stop = () => {
			process.stdin.off('keypress', handler)
		}
		process.stdin.once('keypress', handler)
		return handler
	}

	async processNextOptions(option, prompt, answer) {
		let nextOptions = []
		if (prompt.getNextOptions) {
			nextOptions = ensureArray(await prompt.getNextOptions(answer))
		}
		if (option.next) {
			nextOptions = [...nextOptions, ...(Array.isArray(option.next) ? option.next : [option.next])]
		}
		if (nextOptions.length > 0) {
			this.contextManager.addPromptToQueue(nextOptions)
		} else {
			this.contextManager.addFinalOption(option)
		}
	}

	async getInitialValueForOption(option, autoFillFilter) {
		const PromptType = getPromptTypeFromOption(PROMPT_TYPES, option)
		let initialValue = null
		if (PromptType) {
			const prompt = new PromptType(option)
			if (prompt?.getInitialValue) {
				initialValue = await prompt.getInitialValue(this.getInitialValueForOption.bind(this), this.contextManager, autoFillFilter)
			} else if (option.commandName && this.contextManager.getFirstCommand() === option.commandName) {
				const remainingCommands = this.contextManager.getRemainingCommands()
				if (remainingCommands.length > 0) {
					initialValue = remainingCommands.join(',')
				}
			}
		}
		if (initialValue === null) {
			if (option.name && typeof this.config[option.name] !== 'undefined' && (!autoFillFilter || autoFillFilter(option.name))) {
				initialValue = this.config[option.name]
			} else if (this.config._prompt_sequence && (!autoFillFilter || autoFillFilter('_prompt_sequence'))) {
				initialValue = this.getInitialValueFromPromptSequence()
			}
		}
		return initialValue
	}

	getInitialValueFromPromptSequence() {
		const currentPath = this.config._prompt_sequence.slice(0, this.contextManager.getPromptSequence().length)
		let isPathMatch = true
		currentPath.forEach((path, i) => {
			if (path !== this.contextManager.getPromptSequence()[i]) {
				isPathMatch = false
			}
		})
		return isPathMatch ? this.config._prompt_sequence[this.contextManager.getPromptSequence().length] : null
	}
}
