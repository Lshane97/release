#!/usr/bin/env node
'use strict'

const { program } = require('commander')
const chalk = require('chalk')

const { release, logger } = require('../dist/release.cjs')
const pkg = require('../package.json')

run()

function run() {
  program
    .version(pkg.version, '-v, --version', 'Output the current version.')
    .option('-t, --repo-type <repo-type>', 'Publish type, github or gitlab.')
    .option('-u, --repo-url <repo-url>', 'Github repo url to release.')
    .option('-p, --changelog-preset <changelog-preset>', 'Customize conventional changelog preset.')
    .option('--latest', 'Generate latest changelog', true)

  program.commands.forEach(c => c.on('--help', () => console.log()))

  enhanceErrorMessages('missingArgument', argName => {
    return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
  })

  enhanceErrorMessages('unknownOption', optionName => {
    return `Unknown option ${chalk.yellow(optionName)}.`
  })

  enhanceErrorMessages('optionMissingArgument', (option, flag) => {
    return (
      `Missing required argument for option ${chalk.yellow(option.flags)}` +
      (flag ? `, got ${chalk.yellow(flag)}` : ``)
    )
  })

  program.parse(process.argv)

  const { repoType } = program._optionValues

  if (repoType && repoType !== 'github' && repoType !== 'gitlab') {
    logger.printErrorAndExit(`Expected the --repo-type as github or gitlab, but got ${repoType}.`)
  }

  release(program._optionValues)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

function enhanceErrorMessages(methodName, log) {
  program.Command.prototype[methodName] = function (...args) {
    if (methodName === 'unknownOption' && this._allowUnknownOption) {
      return
    }

    this.outputHelp()

    console.log(`  ` + chalk.red(log(...args)))
    console.log()
    process.exit(1)
  }
}
