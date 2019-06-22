// oaps-hid/index.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';


const i2c = require('i2c-bus');
const path = require('path');
const pngparse = require('pngparse');
const extend = require('extend');
var fs = require('fs');

var i2cBus = i2c.openSync(1);

var openapsDir = "/root/myopenaps"; //if you're using a nonstandard OpenAPS directory, set that here. NOT RECOMMENDED.

try {
    var preferences = JSON.parse(fs.readFileSync(openapsDir+"/preferences.json"));
} catch (e) {
    console.error("Could not load preferences.json", e);
}

// setup the display, depending on its size (Eadiofruit is 128x32 and Explorer HAT is 128x64)
if (preferences.hardwaretype && preferences.hardwaretype == "radiofruit") {
  var displayConfig = require('./config/display.json').radiofruit;
} else {
  var displayConfig = require('./config/display.json').explorerHat;
}

console.log(displayConfig);
displayConfig.i2cBus = i2cBus;

try {
    var display = require('./lib/display/ssd1306')(displayConfig);
    if (preferences.hardwaretype && preferences.hardwaretype == "radiofruit") {
      displayImage('./static/unicorn_128x32.png');
    } else {
      displayImage('./static/unicorn_128x64.png');
    }
} catch (e) {
    console.warn("Could not setup display:", e);
}

function displayImage(pathToImage) {
    pngparse.parseFile(pathToImage, function(err, image) {
      if(err)
        throw err
      display.clear();
      display.oled.drawBitmap(image.data);
    });
}

// setup battery voltage monitor
var voltageConfig = require('./config/voltage.json')
voltageConfig.i2cBus = i2cBus
var voltage = require('./lib/voltage/voltage')(voltageConfig)

// setup socket server for external commands
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
.on('displaystatus', function () {
 if (display) {
    if (preferences.status_screen && preferences.status_screen == "bigbgstatus") {
      bigBGStatus(display, openapsDir);
    } else if (preferences.status_screen && preferences.status_screen == "off") {
      //don't auto-update the screen if it's turned off
    } else if (preferences.status_screen && preferences.status_screen == "blank") {
      display.clear(true);
    } else {
      graphStatus(display, openapsDir); //default to graph status
    }
 }
})

// load up graphical status scripts
const graphStatus = require('./scripts/status.js');
const bigBGStatus = require('./scripts/big_bg_status.js');
// if you want to add your own status display script, it will be easiest to replace one of the above!

// setup the menus

if (preferences.hardwaretype && preferences.hardwaretype == "radiofruit") {
  var buttonsConfig = require('./config/buttons-radiofruit.json');
} else {
  var buttonsConfig = require('./config/buttons-explorerhat.json');
}

var menuConfig = {
  menuFile: process.cwd() + path.sep + './config/menus/menu.json', // file path for the menu definition
  onChange: showMenu, // method to call when menu changes
  menuSettings: {
    displayLines: displayConfig.displayLines - 1, // one line is used for menu title
    moreUpLabel: "  ^ ^ ^",
    moreDownLabel: "  v v v"
  }
};
var hidMenu = require('./lib/hid-menu/hid-menu')(buttonsConfig, menuConfig);

// configure menu events
hidMenu
.on('nothing', function () {
})
.on('showgraphstatus', function () {
  graphStatus(display, openapsDir);
})
.on('showbigBGstatus', function () {
  bigBGStatus(display, openapsDir);
})
.on('showlogo', function () {
 if (preferences.hardwaretype && preferences.hardwaretype == "radiofruit") {
   displayImage('./static/unicorn_128x32.png');
 } else {
   displayImage('./static/unicorn_128x64.png');
 }
})
.on('showvoltage', function () {
  voltage()
  .then(function (v) {
    display.clear();
    display.write('Voltage: ' + v);
  })
  .catch(function (e) {
    console.log(e.toString());
  });
})
.on('menu_changed', function () {
  showMenu(hidMenu);
})
.on('showoutput', function (err, stdout, stderr) {
  display.clear();
  display.write(stdout);
});


// display the current menu on the display
function showMenu(menu) {
  if (display) {
    display.clear();
    var text = '';

    var p = menu.getParentSelect();
    text += p ? '[' + p.label + ']\n' : '';
    var c = menu.getCurrentSelect();
    menu.getActiveMenu().forEach(function (m) {
      text += (m.selected ? '>' : ' ') + m.label + '\n';
    });

    //  console.log(text);
    display.write(text);
  }
}
