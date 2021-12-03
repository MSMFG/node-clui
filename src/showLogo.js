/* eslint-disable no-console */
const fs = require('fs'),
	path = require('path')

const figlet = require('figlet'),
	{ yellow, dim } = require('colors')

const packagePath = path.join(process.cwd(), 'package.json')
const cwdPackage = fs.existsSync(packagePath) ? require(packagePath) : { name: 'Package not found' }

const ALL_FONTS = figlet.fontsSync()

module.exports = ({
	headingText = cwdPackage.name.slice(0, 18),
	headingPadding = 0,
	subHeadingText = null,
	randomFonts = false,
	headingFont,
	subHeadingFont,
	clearScreen = false,
}) => {
	if (clearScreen) {
		console.clear()
	}
	if (randomFonts) {
		headingFont = headingFont || getRandomFont()
		subHeadingFont = subHeadingFont || getRandomFont()
		console.log(dim(`Using random fonts: header = ${headingFont}, sub header = ${subHeadingFont}`))
	} else {
		headingFont = headingFont || 'ANSI Shadow'
		subHeadingFont = subHeadingFont || 'O8'
	}
	console.log(getLogo({ headingText, headingPadding, headingFont, subHeadingText, subHeadingFont }))
}

module.exports.getLogo = getLogo

function getLogo({ headingText, headingPadding, headingFont, subHeadingText, subHeadingFont }) {
	const logo = figlet.textSync(headingText, { font: headingFont, horizontalLayout: 'default' })
	const logos = []
	logos.push(Array(headingPadding).fill(''))
	logos.push(`\n${yellow.bold(logo)}`)
	logos.push(Array(headingPadding).fill(''))
	if (subHeadingText) {
		logos.push(`${yellow(figlet.textSync(subHeadingText, { font: subHeadingFont, horizontalLayout: 'default' }))}`)
	}
	return logos.join('\n') + '\n'
}

function getRandomFont() {
	return ALL_FONTS[Math.round(Math.random() * ALL_FONTS.length)]
}
