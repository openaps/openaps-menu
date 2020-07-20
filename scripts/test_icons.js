// screens/symbol_line.js
// Screen for testing icons
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

var drawReservoirIcon = require('../lib/utils/utils.js').drawReservoirIcon;
var drawBatteryIcon = require('../lib/utils/utils.js').drawBatteryIcon;
var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawWiFiApIcon = require('../lib/utils/utils.js').drawWiFiApIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;
var drawUsbIcon = require('../lib/utils/utils.js').drawUsbIcon;
var drawConnectIcon = require('../lib/utils/utils.js').drawConnectIcon;
const execSync = require('child_process').execSync;

// show battery levels
drawBatteryIcon(display, 0, 0, 100);
drawBatteryIcon(display, 0, 11, 60);
drawBatteryIcon(display, 0, 22, 30);
drawBatteryIcon(display, 0, 33, 5);
drawBatteryIcon(display, 0, 44, 0);
drawBatteryIcon(display, 0, 55 ,-1);

// show pump reservoir icon
drawReservoirIcon(display, 22, 0, 100);
drawReservoirIcon(display, 22, 11, 60);
drawReservoirIcon(display, 22, 22, 30);
drawReservoirIcon(display, 22, 33, 5);
drawReservoirIcon(display, 22, 44, 0);
drawReservoirIcon(display, 22, 55, -1);

// show online connection icon if connected to the Internet
drawConnectIcon(display, 82, 1, true);
drawConnectIcon(display, 82, 12, false);

// show WiFi icon
drawWiFiIcon(display, 98, 0);
drawWiFiApIcon(display, 98, 11);
drawBTIcon(display, 99, 22);
drawUsbIcon(display, 98, 34);
