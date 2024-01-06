/**
 * File source: https://bit.ly/3ukaHTz
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

import type { Config } from '@japa/runner';
import TestUtils from '@ioc:Adonis/Core/TestUtils';
import { runFailedTests, specReporter, apiClient } from '@japa/preset-adonis';
import { expect } from '@japa/expect';

/*
|--------------------------------------------------------------------------
| Japa Plugins
|--------------------------------------------------------------------------
|
| Japa plugins allows you to add additional features to Japa. By default
| we register the assertion plugin.
|
| Feel free to remove existing plugins or add more.
|
*/

function runFailedTestsWhenFlagged() {
  return (data) => {
    if(data.cliArgs.failed) {
      return runFailedTests()
    }
  }
}

export const plugins: Required<Config>['plugins'] = [
	expect(),
	runFailedTestsWhenFlagged(),
	apiClient(),
];

/*
|--------------------------------------------------------------------------
| Japa Reporters
|--------------------------------------------------------------------------
|
| Japa reporters displays/saves the progress of tests as they are executed.
| By default, we register the spec reporter to show a detailed report
| of tests on the terminal.
|
*/
export const reporters: Required<Config>['reporters'] = [specReporter()];

/*
|--------------------------------------------------------------------------
| Runner hooks
|--------------------------------------------------------------------------
|
| Runner hooks are executed after booting the AdonisJS app and
| before the test files are imported.
|
| You can perform actions like starting the HTTP server or running migrations
| within the runner hooks
|
*/
export const runnerHooks: Pick<Required<Config>, 'setup' | 'teardown'> = {
	setup: [
		() => TestUtils.ace().loadCommands(),
		() => import('Tests/Helpers/AppendGlobalHelpers'),
		() => import('Tests/Helpers/AppendApiResponseHelpers'),
	],
	teardown: [],
};

/*
|--------------------------------------------------------------------------
| Configure individual suites
|--------------------------------------------------------------------------
|
| The configureSuite method gets called for every test suite registered
| within ".adonisrc.json" file.
|
| You can use this method to configure suites. For example: Only start
| the HTTP server when it is a functional suite.
*/
export const configureSuite: Required<Config>['configureSuite'] = (suite) => {
	if (suite.name === 'functional') {
		suite.setup(() => TestUtils.httpServer().start());
	}
};
