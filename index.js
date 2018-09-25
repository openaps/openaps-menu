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

// setup the display
var displayConfig = require('./config/display.json');
displayConfig.i2cBus = i2cBus;

try {
    var display = require('./lib/display/ssd1306')(displayConfig);
    displayImage('./static/unicorn.png'); //display logo
} catch (e) {
    console.warn("Could not setup display:", e);
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
  var preferences;
  fs.readFile(openapsDir+'/preferences.json', function (err, data) {
    if (err) throw err;
    preferences = JSON.parse(data);
    if (preferences.status_screen == "bigbgstatus") {
      bigBGStatus(display, openapsDir);
    } else if (preferences.status_screen == "off") {
      //don't auto-update the screen if it's turned off
    } else {
      graphStatus(display, openapsDir); //default to graph status
    }
  });
 }
})

function displayImage(pathToImage) {
    pngparse.parseFile(pathToImage, function(err, image) {
      if(err)
        throw err
      display.clear();
      display.oled.drawBitmap(image.data);
    });
}

// load up graphical status scripts
const graphStatus = require('./scripts/status.js');
const bigBGStatus = require('./scripts/big_bg_status.js');
// if you want to add your own status display script, it will be easiest to replace one of the above!

// setup the menus
var buttonsConfig = require('./config/buttons.json');
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
 displayImage('./static/unicorn.png');
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
