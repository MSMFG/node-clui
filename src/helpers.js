const { Separator } = require('inquirer')

module.exports = {
	getPromptText,
	getMenuText,
	getValue,
	getChoicesFromOptions,
	dedupeArray,
	ensureArray,
	debounceAsyncFunction,
	createExternalPromiseResolver,
	getInferredPromptTypeName,
	getPromptTypeName,
	getPromptTypeFromOption,
	isValidPromptType,
}

function getPromptText(option, context = {}) {
	return typeof option.prompt === 'function' ? option.prompt(context) : option.prompt
}

function getMenuText(option, context = {}) {
	return typeof option.text === 'function' ? option.text(context) : option.text || getPromptText(option, context)
}

function getValue(option, context = {}) {
	return typeof option.value === 'function' ? option.value(context) : option.value || getMenuText(option, context)
}

async function getChoicesFromOptions(options, context) {
	let resolvedOptions = typeof options === 'function' ? await options() : options
	if (!Array.isArray(resolvedOptions)) {
		resolvedOptions = Object.keys(resolvedOptions).flatMap((name) => (resolvedOptions[name].length > 0 ? [new Separator(name), ...resolvedOptions[name]] : []))
	}
	return resolvedOptions.map((option) =>
		option.type === 'separator'
			? option
			: {
					name: getMenuText(option, context),
					value: getValue(option, context),
			  }
	)
}

function dedupeArray(a) {
	const seen = {}
	return a.filter((item) => (seen[item] ? false : (seen[item] = true)))
}

function ensureArray(object) {
	return object ? (Array.isArray(object) ? object : [object]) : []
}

function debounceAsyncFunction(asyncFunc, interval) {
	let timeout
	let queuedResolves = []

	return (...args) => {
		return new Promise((resolve, reject) => {
			if (timeout) {
				clearTimeout(timeout)
			}
			queuedResolves.push(resolve)
			timeout = setTimeout(async () => {
				try {
					const result = await asyncFunc(...args)
					queuedResolves.forEach((r) => r(result))
				} catch (e) {
					reject(e)
				} finally {
					queuedResolves = []
				}
			}, interval)
		})
	}
}

function createExternalPromiseResolver() {
	let resolver
	return { resolver: (...args) => resolver(...args), promise: new Promise((resolve) => (resolver = resolve)) }
}

function getInferredPromptTypeName(option) {
	if (option.source) {
		return 'AutoComplete'
	} else if (option.options) {
		return 'List'
	} else if (option.prompt && option.format?.toLowerCase() === 'boolean') {
		return 'Confirm'
	} else if (option.prompt) {
		return 'Input'
	} else {
		return null
	}
}

function getPromptTypeName(option) {
	return option.type ? option.type.name : getInferredPromptTypeName(option)
}

function getPromptTypeFromOption(PROMPT_TYPES, option) {
	const promptTypeName = getPromptTypeName(option)
	return promptTypeName ? PROMPT_TYPES[promptTypeName] : null
}

function isValidPromptType(option) {
	return option.type || getInferredPromptTypeName(option) !== null
}
