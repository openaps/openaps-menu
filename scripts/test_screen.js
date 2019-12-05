// oaps-hid/index.js

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



require('../screens/status_system.js')(display, openapsDir);