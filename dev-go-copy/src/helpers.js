const fs = require('fs'),
	path = require('path')

const ACTION_TYPES = require('./ActionTypes')

module.exports = { getOptions, writeConfigToDisk, getInferredActionTypeName, getActionTypeName, getActionTypeFromOption }

async function getOptions(optionsPath) {
	const optionsPathNoExt = path.join(path.dirname(optionsPath), path.basename(optionsPath, path.extname(optionsPath)))
	if (!fs.existsSync(`${optionsPathNoExt}.js`) && !fs.existsSync(`${optionsPathNoExt}.json`)) {
		throw new Error(`Menu config file not found : ${optionsPath}`)
	}

	const optionsConfig = require(optionsPath)
	let resolvedOptionsConfig = optionsConfig
	if (typeof optionsConfig === 'function') {
		resolvedOptionsConfig = await optionsConfig()
	}
	resolvedOptionsConfig = typeof optionsConfig === 'function' ? resolvedOptionsConfig : optionsConfig

	return resolvedOptionsConfig
}

function writeConfigToDisk(configPath, config) {
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function getInferredActionTypeName(option) {
	if (option.cmd) {
		return 'Action'
	} else if (option.replay) {
		return 'Replay'
	} else {
		return null
	}
}

function getActionTypeName(option) {
	return option.type ? option.type.name : getInferredActionTypeName(option)
}

function getActionTypeFromOption(option) {
	const actionTypeName = getActionTypeName(option)
	return actionTypeName ? ACTION_TYPES[actionTypeName] : null
}
