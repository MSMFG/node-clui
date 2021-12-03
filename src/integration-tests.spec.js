/* eslint-disable no-console */
const CliHelper = require('../test-helpers/CliHelper')

const createCli = require('./createCli')

const CLI_OPTION_SIMPLE = [
	{
		commandName: 'option1',
		prompt: 'Enter option 1',
		name: 'opt1',
	},
]

// const CLI_OPTIONS_NESTED_WITH_COMMAND = {
// 	prompt: 'test question',
// 	options: [
// 		{
// 			commandName: 'option1',
// 			text: 'option 1',
// 			prompt: 'Enter option 1',
// 			name: 'opt1',
// 		},
// 		{
// 			commandName: 'option2',
// 			text: 'option 2',
// 			prompt: 'Enter option 2',
// 			name: 'opt2',
// 		},
// 	],
// }

describe('createCli', () => {
	beforeEach(() => {
		CliHelper.beforeEachTest()
	})

	describe('Given simple flat option', () => {
		describe('And option has a commandName', () => {
			describe('When user selects option via prompt', () => {
				it('Should set answers.command to commandName', async () => {
					const userInputValue = 'option1UserInputValue'

					CliHelper.addPromptResponse(userInputValue)
					const result = await createCli({ autoFill: true }, CLI_OPTION_SIMPLE)

					expect(result?.answers?.command).toEqual('option1')
				})
			})

			describe('And autoFill is "true"', () => {
				describe('When user specifies ONLY a command name via CLI', () => {
					it('Should prompt user for input', async () => {
						CliHelper.addUserCliArguments('option1')
						const promptMock = CliHelper.addPromptResponse()
						await createCli({ autoFill: true }, CLI_OPTION_SIMPLE)

						expect(promptMock.mock.calls.length).toEqual(1)
					})
				})

				describe('When user specifies BOTH command name and value via CLI', () => {
					it('Should set answers.command to commandName', async () => {
						const userCliArgValue = 'option1UserCliArgValue'

						CliHelper.addUserCliArguments('option1', userCliArgValue)
						const result = await createCli({ autoFill: true }, CLI_OPTION_SIMPLE)

						expect(result?.answers?.command).toEqual('option1')
					})
				})
			})

			describe.each([false, undefined, null])('And autoFill is off(%s)', (autoFill) => {
				describe('When user specifies ONLY a command name via CLI', () => {
					it('Should prompt user for input', async () => {
						CliHelper.addUserCliArguments('option1')
						const promptMock = CliHelper.addPromptResponse()
						await createCli({ autoFill }, CLI_OPTION_SIMPLE)

						expect(promptMock.mock.calls.length).toEqual(1)
					})

					it('Should have no initial value for prompt', async () => {
						CliHelper.addUserCliArguments('option1')
						const promptMock = CliHelper.addPromptResponse('promptValue')

						await createCli({ autoFill }, CLI_OPTION_SIMPLE)

						const firstArgPassedToPrompt = promptMock.mock.calls[0][0]
						expect(firstArgPassedToPrompt?.default).toBeNull()
					})
				})

				describe('When user specifies BOTH command name and value via CLI', () => {
					const userCliArgValue = 'cliArgValue'

					it('Should prompt user for input', async () => {
						CliHelper.addUserCliArguments('option1', userCliArgValue)
						const promptMock = CliHelper.addPromptResponse()
						await createCli({ autoFill }, CLI_OPTION_SIMPLE)

						expect(promptMock.mock.calls.length).toEqual(1)
					})

					it('Should set initial value for prompt to command value from CLI', async () => {
						CliHelper.addUserCliArguments('option1', userCliArgValue)
						const promptMock = CliHelper.addPromptResponse('promptValue')

						await createCli({ autoFill }, CLI_OPTION_SIMPLE)

						const firstArgPassedToPrompt = promptMock.mock.calls[0][0]
						expect(firstArgPassedToPrompt?.default).toEqual(userCliArgValue)
					})
				})
			})
		})

		describe('And option has a default value', () => {
			const optionDefaultValue = 'option1DefaultValue'

			describe('And autoFill is "true"', () => {
				it('Should NOT prompt user for input', async () => {
					const result = await createCli({ autoFill: true, opt1: optionDefaultValue }, CLI_OPTION_SIMPLE)

					expect(result?.answers?.opt1).toEqual(optionDefaultValue)
				})

				it('Should override default value with CLI argument', async () => {
					const cliArgValue = 'option1CliArgValue'

					CliHelper.addUserCliArguments('--opt1', cliArgValue)
					const result = await createCli({ autoFill: true, opt1: optionDefaultValue }, CLI_OPTION_SIMPLE)

					expect(result?.answers?.opt1).toEqual(cliArgValue)
				})
			})

			describe.each([false, undefined, null])('And autoFill is off(%s)', (autoFill) => {
				it('Should prompt user for input', async () => {
					const userInputValue = 'option1UserInputValue'

					CliHelper.addPromptResponse(userInputValue)
					const result = await createCli({ autoFill, opt1: optionDefaultValue }, CLI_OPTION_SIMPLE)

					expect(result?.answers?.opt1).toEqual(userInputValue)
				})
			})
		})
	})

	// describe('Given options with nested commands', () => {
	// 	describe('And option has a default value', () => {
	// 		describe('And autoFill is "true"', () => {
	// 			it('Should NOT prompt user for input', async () => {
	// 				CliHelper.addUserInputResponse('option 2')
	// 				const result = await createCli({ autoFill: true, opt2: 'option2DefaultValue' }, CLI_OPTIONS_NESTED_WITH_COMMAND)

	// 				expect(result?.answers?.command).toEqual('option2')
	// 				expect(result?.answers?.opt2).toEqual('option2DefaultValue')
	// 			})

	// 			it('Should override default value with CLI argument', async () => {
	// 				CliHelper.addUserCliArguments('')
	// 				CliHelper.addUserInputResponse('option 2')
	// 				const result = await createCli({ autoFill: true, opt2: 'option2DefaultValue' }, CLI_OPTIONS_NESTED_WITH_COMMAND)

	// 				expect(result?.answers?.command).toEqual('option2')
	// 				expect(result?.answers?.opt2).toEqual('option2DefaultValue')
	// 			})
	// 		})

	// 		describe.each([false, undefined, null])('And autoFill is off(%s)', (autoFill) => {
	// 			it('Should prompt user for input when option has default value', async () => {
	// 				CliHelper.addUserInputResponse('option 2')
	// 				CliHelper.addUserInputResponse('option2UserSpecifiedValue')
	// 				const result = await createCli({ autoFill, opt2: 'option2DefaultValue' }, CLI_OPTIONS_NESTED_WITH_COMMAND)

	// 				expect(result?.answers?.command).toEqual('option2')
	// 				expect(result?.answers?.opt2).toEqual('option2UserSpecifiedValue')
	// 			})
	// 		})
	// 	})
	// })

	// it('Does something else', async () => {
	// 	const result = await createCli({}, [
	// 		{
	// 			commandName: 'prepare',
	// 			text: 'Prepare web server',
	// 			prompt: 'What is the location of your webpack config?',
	// 			name: 'configPath',
	// 			next: {
	// 				prompt: 'Where would you like to output the prepared web server?',
	// 				name: 'outputPath',
	// 				next: {
	// 					text: 'Force override of output if already exists?',
	// 					name: 'force',
	// 				},
	// 			},
	// 		},
	// 	])
	// 	console.log(result)
	// })
})
