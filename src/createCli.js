/* eslint-disable no-console */
const fs = require('fs'),
	path = require('path'),
	util = require('util')

const yargs = require('yargs'),
	{ hideBin } = require('yargs/helpers'),
	{ yellow } = require('colors')

const { getPromptText, getMenuText, ensureArray, getPromptTypeFromOption } = require('./helpers')
const PROMPT_TYPES = require('./CliPromptTypes')
const PromptManager = require('./PromptManager'),
	ContextManager = require('./ContextManager'),
	ValueManager = require('./ValueManager'),
	ConfigManager = require('./ConfigManager')

module.exports = async (defaultConfig = {}, optionsOrHandler) => {
	const configManager = new ConfigManager({ defaultConfig })

	let handlerError = null,
		handler
	if (typeof optionsOrHandler !== 'function') {
		handler = async (showCli) => {
			try {
				await showCli(optionsOrHandler)
			} catch (e) {
				handlerError = `An error occurred whilst navigating the cli...\n${e.stack}`
			}
		}
	} else {
		handler = optionsOrHandler
	}

	let answers = null,
		finalOptions = null
	const standardConfig = configManager.getStandardConfig()

	const cliBuilder = async (option, optionsRelativeFolder = process.cwd()) => {
		const options = ensureArray(option)
		const yargsCli = buildYargsCliFromOptions(options, defaultConfig)
		const args = getArgsFromYargs(defaultConfig, standardConfig, yargsCli.argv, optionsRelativeFolder)

		if (args.help || args.version) {
			return
		}

		if (args.inspect) {
			console.log(`${yellow('----- Options ------')}\n` + util.inspect(options, false, 10, true))
			console.log(`${yellow('--- Yargs Config ---')}\n` + util.inspect(yargsCli, false, 10, true))
			return
		}

		const contextManager = new ContextManager({ commands: args.command })
		const valueManager = new ValueManager({ contextManager, config: args })
		const promptManager = new PromptManager({ contextManager, valueManager, config: args })
		const result = await promptManager.show(options)
		answers = result.answers
		finalOptions = result.finalOptions
	}

	await handler(cliBuilder, standardConfig)

	return { error: handlerError, answers, finalOptions, isCancelled: finalOptions && finalOptions.length === 0 }
}

function buildYargsCliFromOptions(options, defaultConfig) {
	const allOptions = getAllOptions(options)
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
				...(typeof defaultConfig[name] !== 'undefined' ? { default: defaultConfig[name] } : {}),
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

function getArgsFromYargs(defaultConfig, standardConfig, yargsConfig, optionsRelativeFolder) {
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
function getAllOptions(options) {
	let allOptions = []
	for (const option of options) {
		allOptions.push(option)
		if (option.next) {
			allOptions = allOptions.concat(getAllOptions(ensureArray(option.next)))
		}
		if (option.options) {
			allOptions = allOptions.concat(getAllOptions(ensureArray(option.options)))
		}
	}
	return allOptions
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
