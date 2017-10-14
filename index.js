// oaps-hid/index.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';


const i2c = require('i2c-bus');
const path = require('path');


var i2cBus = i2c.openSync(1);

// setup the display
var displayConfig = require('./config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('./lib/display/ssd1306')(displayConfig);


// setup battery voltage monitor
var voltageConfig = require('./config/voltage.json');
voltageConfig.i2cBus = i2cBus;
var voltage = require('./lib/voltage/voltage')(voltageConfig);
/*
setInterval(function () {
  voltage()
  .then(function (v) {
    console.log('Voltage: ' + v);
  })
  .catch(function (e) {
    console.log(e.toString());
  });
}, 1000);
*/



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
  display.clear();
  var text = '';

  var p = menu.getParentSelect();
  text += p ? '[' + p.label + ']\n' : '';
  var c = menu.getCurrentSelect();
  menu.getActiveMenu().forEach(function (m) {
    text += (m.selected ? '>' : ' ') + m.label + '\n';
  });

  console.log(text);
  display.write(text);
}


// show the menu after a slight pause
//setTimeout(function () { showMenu(hidMenu); }, 2000);
