// oaps-hid/index.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var fs = require('fs');
var font = require('oled-font-5x7');

const displayImage = require('./lib/utils/utils.js').displayImage;

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
  var displayConfig = require('./config/display.json').radiofruit;
  var buttonsConfig = require('./config/buttons-radiofruit.json');
} else if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "explorer-hat") {
  var displayConfig = require('./config/display.json').explorerHat;
  var buttonsConfig = require('./config/buttons-explorerhat.json');
} else {
  throw ("hardware type \"" + preferences.hardwaretype + "\" not supported! Exit.");
}
displayConfig.i2cBus = i2cBus;

try {
    var display = require('./lib/display/ssd1306')(displayConfig);
    if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "radiofruit") {
      displayImage('./static/unicorn_128x32.png', display);
    } else if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "explorer-hat") {
      displayImage('./static/unicorn_128x64.png', display);
    }
} catch (e) {
    console.warn("Could not setup display:", e);
	throw '';
}

const menuConfig = {
  menuFile: process.cwd() + path.sep + './config/menus/menu.json', // file path for the menu definition
  menuSettings: {
    displayLines: displayConfig.displayLines - 1, // one line is used for menu title
    moreUpLabel: " < < <",
    moreDownLabel: " > > >"
  }
};


// setup screens
// TODO add radiofruit
if (preferences.hardwaretype && preferences.hardwaretype.toLowerCase() === "explorer-hat") {
	var textStatus = require('./screens/status_text.js');
	var graphStatus = require('./screens/status_graph.js');
	var systemStatus = require('./screens/status_system.js');
	var batteryDrainedScreen = require('./screens/status_battery_drained.js');
} else {
	throw ("hardware type \"" + preferences.hardwaretype + "\" not supported! Exit.");
}
const screens = [textStatus, graphStatus, systemStatus];

// setup sub-menus
const menuApsPath = process.cwd() + path.sep + './scripts/menuAPS.json';
const menuSystemPath = process.cwd() + path.sep + './scripts/menuSystem.json';
const subMenus = [menuApsPath, menuApsPath, menuSystemPath];

var hidMenu = require('./scripts/screen_menu.js')(buttonsConfig, menuConfig, display, openapsDir, screens, subMenus);

// configure menu events
hidMenu
// .on('nothing', function () {
// })
// .on('showgraphstatus', function () {
  // graphStatus(display, openapsDir);
// })
// .on('showbigBGstatus', function () {
  // bigBGStatus(display, openapsDir);
// })
// .on('showRadiofruitStatus', function () {
  // radiofruitStatus(display, openapsDir);
// })
// .on('showlogo', function () {
 // if (preferences.hardwaretype && preferences.hardwaretype == "radiofruit") {
   // displayImage('./static/unicorn_128x32.png');
 // } else {
   // displayImage('./static/unicorn_128x64.png');
 // }
// })
// .on('showvoltage', function () {
  // voltage()
  // .then(function (v) {
    // display.clear();
    // display.write('Voltage: ' + v);
  // })
  // .catch(function (e) {
    // console.log(e.toString());
  // });
// })
// .on('menu_changed', function () {
  // showMenu(hidMenu);
// })
// .on('clearScreen', function () {
  // display.clear();
// })
.on('showoutput', function (err, stdout, stderr) {
  display.clear();
  display.write(stdout);
});

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

// setup battery voltage monitor
var voltageConfig = require('./config/voltage.json')
voltageConfig.i2cBus = i2cBus
var voltage = require('./lib/voltage/voltage')(voltageConfig)
var batteryConfig = require('./config/battery.json')
var socketServer = require('./lib/socket-server/socket-server')({
  voltage: voltage,
  battery: batteryConfig
})
socketServer
.on('error', (err) => {
  console.log('socket-server error: ', err.reason)
})
.on('warning', (warn) => {
  console.log('socket-server warning: ', warn.reason)
})
.on('voltage_update', (response) => {
	// start shutdown sequence at 2% battery
	if (response.battery <= 2){
		if (!shutdownStarted){
			// show warning to user	
			const { exec } = require('child_process');
			exec('service cron stop');		
			exec('shutdown -P +10');
			shutdownStarted = true;
			
			var shutdownDate = new Date(Date.now() + 10*60000); // in 10 minutes
			setShutdownInterval(shutdownDate);
		}
	} else {
		if (shutdownStarted){			
			const { exec } = require('child_process');
			exec('shutdown -c');
			display.clear();
			display.oled.setCursor(3,2);
			display.oled.writeString(font, 1, "Reboot...", 1, false, 0, false);
			exec('shutdown -r now');
		}
	}
});
