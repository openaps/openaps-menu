// oaps-hid/index.js

/*jslint node: true */
/*jslint esversion: 6 */

"use strict";

const i2c = require("i2c-bus");
const path = require("path");
const pngparse = require("pngparse");
const extend = require("extend");

var i2cBus = i2c.openSync(1);

// setup battery voltage monitor
var voltage = setupVoltageMonitor();

// setup the display
try {
  var displayConfig = setupDisplayConfig();
  var display = setupDisplay();
  setupMenus();
} catch (error) {
  console.warn("Warning: Could not set up display", error);
}

function setupDisplayConfig() {
  var displayConfig = require("./config/display.json");
  displayConfig.i2cBus = i2cBus;
  return displayConfig;
}

function setupDisplay() {
  var display = require("./lib/display/ssd1306")(displayConfig);
  // display the logo
  pngparse.parseFile("./static/unicorn.png", function(err, image) {
    if (err) throw err;
    display.clear();
    display.oled.drawBitmap(image.data);
  });
  return { displayConfig, display };
}

function setupMenus() {
  var buttonsConfig = require("./config/buttons.json");
  var menuConfig = {
    menuFile: process.cwd() + path.sep + "./config/menus/menu.json",
    onChange: showMenu,
    menuSettings: {
      displayLines: displayConfig.displayLines - 1,
      moreUpLabel: "  ^ ^ ^",
      moreDownLabel: "  v v v"
    }
  };
  var hidMenu = require("./lib/hid-menu/hid-menu")(buttonsConfig, menuConfig);
  // configure menu events
  hidMenu
    .on("nothing", function() {})
    .on("showvoltage", function() {
      voltage()
        .then(function(v) {
          display.clear();
          display.write("Voltage: " + v);
        })
        .catch(function(e) {
          console.log(e.toString());
        });
    })
    .on("menu_changed", function() {
      showMenu(hidMenu);
    })
    .on("showoutput", function(err, stdout, stderr) {
      display.clear();
      display.write(stdout);
    });
}

function setupVoltageMonitor() {
  var voltageConfig = require("./config/voltage.json");
  voltageConfig.i2cBus = i2cBus;
  var voltage = require("./lib/voltage/voltage")(voltageConfig);
  // setup socket server for external commands
  var batteryConfig = require("./config/battery.json");
  var socketServer = require("./lib/socket-server/socket-server")({
    voltage: voltage,
    battery: batteryConfig
  });
  socketServer
    .on("error", err => {
      console.log("socket-server error: ", err.reason);
    })
    .on("warning", warn => {
      console.log("socket-server warning: ", warn.reason);
    });
  return voltage;
}

// display the current menu on the display
function showMenu(menu) {
  display.clear();
  var text = "";

  var p = menu.getParentSelect();
  text += p ? "[" + p.label + "]\n" : "";
  var c = menu.getCurrentSelect();
  menu.getActiveMenu().forEach(function(m) {
    text += (m.selected ? ">" : " ") + m.label + "\n";
  });

  //  console.log(text);
  display.write(text);
}
