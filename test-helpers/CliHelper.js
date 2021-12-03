const inquirer = require('inquirer')
// eslint-disable-next-line no-undef
jest.mock('inquirer')

module.exports = {
	beforeEachTest() {
		inquirer.prompt.mockReset()
		process.stdin.isTTY = true
		process.argv = [process.argv0[0], process.argv0[1]]
	},
	addPromptResponse(value) {
		return inquirer.prompt.mockImplementationOnce(async () => {
			return {
				result: value,
			}
		})
	},
	addUserCliArguments(...args) {
		args.forEach((arg) => process.argv.push(arg))
	},
}
