// scripts/test_screen.js
// Set up libraries and screen preferences to test a menu screen (which is specified in last line)
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var fs = require('fs');

var i2cBus = i2c.openSync(1);

//if you're using a nonstandard OpenAPS directory, set that here. NOT RECOMMENDED.
var openapsDir = "/root/myopenaps"; 

// load openaps preferences
try {
    var preferences = JSON.parse(fs.readFileSync(openapsDir+"/preferences.json"));
} catch (e) {
    console.error("Could not load preferences.json", e);
}

// setup the display, depending on its size (Radiofruit is 128x32 and Explorer HAT is 128x64)
// and setup buttons depending on HAT (Radiofruit 3 buttons / Explorer HAT 2 buttons)
if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "radiofruit") {
  var displayConfig = require('../config/display.json').radiofruit;
} else if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "explorer-hat") {
  var displayConfig = require('../config/display.json').explorerHat;
} else {
  throw ("hardware type \"" + preferences.hardwaretype + "\" not supported! Exit.");
}
displayConfig.i2cBus = i2cBus;

try {
    var display = require('../lib/display/ssd1306')(displayConfig);
} catch (e) {
    console.warn("Could not setup display:", e);
	throw '';
}

// load pump preferences for symbol line in screens
try {
    var pumpPref = JSON.parse(fs.readFileSync("../config/pump.json"));
} catch (e) {
    console.error("Status screen display error: could not parse config/pump.json: ", e);
    // fallback options
    var pumpPref = {
      "pumpBatteryTypes": [{ "type": "Default", "high": 1.47, "low": 1.20 }],
      "pumpBatteryIndex": 0,
      "pumpReservoirSize" : 300
    }
}

require('../screens/status_text_128x32_2.js')(display, openapsDir, pumpPref);
//require('./icon_test.js')(display, openapsDir, pumpPref);
