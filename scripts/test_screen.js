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


// setup screens
// TODO add radiofruit
if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "explorer-hat") {
	var textStatus = require('../screens/status_text.js');
	var graphStatus = require('../screens/status_graph.js');
	var systemStatus = require('../screens/status_system.js');
} else {
	throw ("hardware type \"" + preferences.hardwaretype + "\" not supported! Exit.");
}

//textStatus(display, openapsDir)

var batteryDrainedScreen = require('../screens/status_battery_drained.js');
var shutdownInterval;
var blinkInterval;
var invert = false;
var shutdownStarted = false;
function setShutdownInterval(shutdownDate){
	batteryDrainedScreen(display,shutdownDate);
	
	if (typeof shutdownInterval !== 'undefined'){
		clearInterval(shutdownInterval);
	}
	if (typeof blinkInterval !== 'undefined'){
		clearInterval(blinkInterval);
	}
	
	blinkInterval = setInterval(() => {
		invert = !invert;
		display.oled.invertDisplay(invert);
		display.oled.dimDisplay(true); 
		display.oled.update();
	}, 1000);

	shutdownInterval = setInterval(() => {
		batteryDrainedScreen(display,shutdownDate);
		const { exec } = require('child_process');
		exec('./scripts/getvoltage.sh');
	}, 60000);
}


		if (!shutdownStarted){
			// show warning to user	
			const { exec } = require('child_process');
			exec('service cron stop');		
			exec('shutdown -P +10');
			shutdownStarted = true;
			
			var shutdownDate = new Date(Date.now() + 10*60000); // in 10 minutes
			setShutdownInterval(shutdownDate);
		}

//require('../screens/status_battery_drained.js')(display, openapsDir, new Date());