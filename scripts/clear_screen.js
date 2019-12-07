// scripts/clear_screen.js
// Makes the display black
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

var i2cBus = require('i2c-bus').openSync(1);

// setup the display
var displayConfig = require('../config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('../lib/display/ssd1306')(displayConfig);

//clear the display
display.clear();
