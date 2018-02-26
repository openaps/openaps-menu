
'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
const exec = require('child_process').exec;

var os = require( 'os' );
var fs = require('fs');
var font = require('oled-font-5x7');
var i2cBus = i2c.openSync(1);
//var enacted = require("../../../myopenaps/enact/enacted.json");
//var glucose = require("../../../myopenaps/monitor/glucose.json");

// setup the display
var displayConfig = require('../config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('../lib/display/ssd1306')(displayConfig);

//Parse and display enacted.json
var enactedjson = fs.readFileSync("../../../myopenaps/enact/enacted.json");
var enacted = JSON.parse(enactedjson);

//Parse, process, and display battery gauge
display.oled.drawLine(115, 57, 127, 57, 1); //top
display.oled.drawLine(115, 63, 127, 63, 1); //bottom
display.oled.drawLine(115, 57, 115, 63, 1); //left
display.oled.drawLine(127, 57, 127, 63, 1); //right
display.oled.drawLine(114, 59, 114, 61, 1); //iconify
exec('bash getvoltage.sh',
	(error, stdout, stderr) => {
	var batt = (`${stdout}`);
	console.log(batt);
	batt = JSON.parse(batt);
	batt = batt.battery;
	console.log(batt);
    });

//var batteryjson = fs.readFileSync("../../../myopenaps/monitor/edison-battery.json");
var battery = Math.round(127 - (batt / 10));
console.log(batt);
console.log(battery);
display.oled.fillRect(battery, 58, 126, 62, 1); //fill battery gauge
//Create and render clock
function displayClock() {
  var date=new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  display.oled.setCursor(55, 57);
  display.oled.writeString(font, 1, hour+":"+min, 1, true);
}

displayClock();

//Check internet connectivity
require('dns').resolve('www.google.com', function(err) {
  if (err) {
     console.log("No connection");
  } else {
     console.log("Connected");
  }
});
