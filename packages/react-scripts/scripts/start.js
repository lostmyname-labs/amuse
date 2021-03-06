// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
// @remove-on-eject-end

'use strict';

process.env.NODE_ENV = 'development';

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
require('dotenv').config({ silent: true });

var fs = require('fs');
var chalk = require('chalk');
var detect = require('detect-port');
var WebpackDevServer = require('webpack-dev-server');
var clearConsole = require('react-dev-utils/clearConsole');
var checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
var getProcessForPort = require('react-dev-utils/getProcessForPort');
var openBrowser = require('react-dev-utils/openBrowser');
var prompt = require('react-dev-utils/prompt');
var paths = require('../config/paths');
var config = require('../config/webpack.config.dev');
var devServerConfig = require('../config/webpackDevServer.config');
var createWebpackCompiler = require('./utils/createWebpackCompiler');
var addWebpackMiddleware = require('./utils/addWebpackMiddleware');

var useYarn = fs.existsSync(paths.yarnLockFile);
var cli = useYarn ? 'yarn' : 'npm';
var isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
var DEFAULT_PORT = parseInt(process.env.PORT, 10) || 4000;

function run(port) {
  var protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  var host = process.env.HOST || 'localhost';

  // Create a webpack compiler that is configured with custom messages.
  var compiler = createWebpackCompiler(config, function onReady(
    showInstructions
  ) {
    if (!showInstructions) {
      return;
    }
    console.log();
    console.log('The app is running at:');
    console.log();
    console.log('  ' + chalk.cyan(protocol + '://' + host + ':' + port + '/'));
    console.log();
    console.log('Note that the development build is not optimized.');
    console.log(
      'To create a production build, use ' +
        chalk.cyan(cli + ' run build') +
        '.'
    );
    console.log();
  });

  devServerConfig.setup = require('./utils/app');

  var devServer = new WebpackDevServer(compiler, devServerConfig);

  // Our custom middleware proxies requests to /index.html or a remote API.
  addWebpackMiddleware(devServer);

  // Launch WebpackDevServer.
  devServer.listen(port, err => {
    if (err) {
      return console.log(err);
    }

    if (isInteractive) {
      clearConsole();
    }

    console.log(chalk.cyan('Starting the development server...'));

    openBrowser(protocol + '://' + host + ':' + port + '/');
  });
}

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
detect(DEFAULT_PORT).then(port => {
  if (port === DEFAULT_PORT) {
    run(port);
    return;
  }

  if (isInteractive) {
    clearConsole();
    var existingProcess = getProcessForPort(DEFAULT_PORT);
    var question =
      chalk.yellow(
        'Something is already running on port ' +
          DEFAULT_PORT +
          '.' +
          (existingProcess ? ' Probably:\n  ' + existingProcess : '')
      ) + '\n\nWould you like to run the app on another port instead?';

    prompt(question, true).then(shouldChangePort => {
      if (shouldChangePort) {
        run(port);
      }
    });
  } else {
    console.log(
      chalk.red('Something is already running on port ' + DEFAULT_PORT + '.')
    );
  }
});
