#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path'),
	util = require('util')

const { red, gray } = require('colors')

const { createCli } = require('@serenity-web-tools/builder-cli')

const { getOptions, writeConfigToDisk, getActionTypeFromOption } = require('../src/helpers')

const DEFAULT_OPTIONS_FILENAME = 'menufile',
	DEFAULT_OPTIONS_PATH = path.join(process.cwd(), DEFAULT_OPTIONS_FILENAME)
const CONFIG_FILENAME = 'lso-go.json',
	CONFIG_PATH = path.join(process.cwd(), CONFIG_FILENAME)

;(async () => {
	process.exitCode = 1
	const { answers, finalOptions } = await createCli(
		{ config: CONFIG_PATH, options: DEFAULT_OPTIONS_PATH, autoFill: true },
		async (showCli, { options: optionsPath }) => {
			console.log('options path', optionsPath)
			const optionsRelativeFolder = path.dirname(optionsPath)

			const options = await getOptions(optionsPath)
			try {
				await showCli(options, optionsRelativeFolder)
			} catch (e) {
				console.error(red('An error occurred whilst navigating the menu...\n'))
				console.error(e)
				process.exitCode = 1
			}
		}
	)

	if (!finalOptions) {
		console.error(gray('Showing help'))
		process.exitCode = 2
	} else if (finalOptions.length === 0) {
		console.error(red('Unknown error, no options selected.'))
		process.exitCode = 130
	} else {
		let validAction = false
		for (let option of finalOptions) {
			const ActionType = getActionTypeFromOption(option)
			if (ActionType) {
				const actionType = new ActionType(option, process.cwd())
				await actionType.execute(answers)
				validAction = true
			}
		}
		if (validAction) {
			writeConfigToDisk(CONFIG_PATH, answers)
			process.exitCode = 0
		} else {
			console.error(gray(`No action type found, terminating without running command.\n${util.inspect(finalOptions, false, 10, true)}`))
			process.exitCode = 3
		}
	}
})()
