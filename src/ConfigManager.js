const fs = require('fs'),
	path = require('path')

const yargs = require('yargs'),
	{ hideBin } = require('yargs/helpers')

const { getPromptText, getMenuText, ensureArray, getPromptTypeFromOption } = require('./helpers'),
	PROMPT_TYPES = require('./CliPromptTypes')

module.exports = class {
	constructor({ defaultConfig }) {
		this.defaultConfig = defaultConfig
	}

	getStandardConfig() {
		const basicConfig = yargs
			.exitProcess(false)
			.help(false)
			.options({
				config: {
					type: 'string',
					describe: 'File path to config file.',
					demandOption: false,
					default: this.defaultConfig.config,
				},
				autoFill: {
					type: 'boolean',
					describe: 'Whether to skip prompts when an answer is already specified.',
					demandOption: false,
					default: this.defaultConfig.autoFill,
				},
				inspect: {
					type: 'boolean',
					describe: 'Displays the full listings of options supplied to the CLI. Useful for debugging.',
					demandOption: false,
				},
			}).argv

		return { ...this.defaultConfig, ...basicConfig }
	}

	buildYargsCliFromOptions(options) {
		const allOptions = this.#getAllOptions(options)
		const yargsOptions = Object.fromEntries(
			Object.entries(
				allOptions
					.filter((option) => option.name && typeof option != 'function')
					.reduce(
						(result, option) => ({
							...result,
							[option.name]: [...(result[option.name] || []), option],
						}),
						{}
					)
			).map(([name, options]) => [
				name,
				{
					describe: options.map((option) => getPromptText(option) || getMenuText(option)).join('\n'),
					type: determineYargsTypeFromOption(options[0]),
					...(typeof this.defaultConfig[name] !== 'undefined' ? { default: this.defaultConfig[name] } : {}),
					coerce(val) {
						if (Array.isArray(val) && determineYargsTypeFromOption(options[0]) !== 'array' && val.length > 0) {
							return val[val.length - 1]
						} else {
							return val
						}
					},
				},
			])
		)
		const yargsConfig = yargs(hideBin(process.argv)).alias('h', 'help').exitProcess(false).help(true).wrap(100).options(yargsOptions)

		const yargsCommands = allOptions
			.filter((option) => option.commandName && typeof option != 'function')
			.map((option) => ({ commandName: option.commandName, prompt: getMenuText(option) }))
		yargsCommands.forEach(({ commandName, prompt }) => yargsConfig.command(commandName, prompt))

		return yargsConfig
	}

	getArgsFromYargs(defaultConfig, standardConfig, yargsConfig, optionsRelativeFolder) {
		const userHasSpecifiedCustomConfigFile = defaultConfig.config !== standardConfig.config

		let loadedConfig = {}
		if (standardConfig.config) {
			const finalConfigObjectOrPath = path.resolve(optionsRelativeFolder, standardConfig.config)
			if (typeof finalConfigObjectOrPath === 'object') {
				loadedConfig = finalConfigObjectOrPath
			} else if (fs.existsSync(finalConfigObjectOrPath)) {
				loadedConfig = require(finalConfigObjectOrPath)
			} else if (userHasSpecifiedCustomConfigFile) {
				throw new Error(`Unable to load config, as file not found : ${finalConfigObjectOrPath}`)
			}
		}
		const finalConfig = { ...standardConfig, ...loadedConfig, ...yargsConfig }

		if (finalConfig._.length > 0) {
			finalConfig.command = finalConfig._
		} else {
			finalConfig.command = defaultConfig.command ? ensureArray(defaultConfig.command) : []
		}

		const sources = {
			...Object.fromEntries(
				Object.entries(standardConfig)
					.filter(([, v]) => v)
					.map(([k]) => [k, 'cli'])
			),
			...Object.fromEntries(
				Object.entries(loadedConfig)
					.filter(([, v]) => v)
					.map(([k]) => [k, 'configfile'])
			),
			...Object.fromEntries(
				Object.entries(yargsConfig)
					.filter(([, v]) => v)
					.map(([k]) => [k, 'cli'])
			),
			...Object.fromEntries(
				Object.entries(defaultConfig)
					.filter(([k, v]) => v && finalConfig[k] === v)
					.map(([k]) => [k, 'default'])
			),
		}

		finalConfig._args_sources = sources

		return finalConfig
	}

	/* FIXME should get information from prompts and helper */
	#getAllOptions = function (options) {
		let allOptions = []
		for (const option of options) {
			allOptions.push(option)
			if (option.next) {
				allOptions = allOptions.concat(this.#getAllOptions(ensureArray(option.next)))
			}
			if (option.options) {
				allOptions = allOptions.concat(this.#getAllOptions(ensureArray(option.options)))
			}
		}
		return allOptions
	}
}

function determineYargsTypeFromOption(option) {
	const PromptType = getPromptTypeFromOption(PROMPT_TYPES, option)
	if (PromptType) {
		const promptType = new PromptType(option)
		if (promptType.getTypeOfValue) {
			return promptType.getTypeOfValue()
		} else {
			return 'string'
		}
	} else {
		if (option.format) {
			return option.format
		} else if (typeof option.value === 'function') {
			return 'string'
		} else {
			return 'boolean'
		}
	}
}
