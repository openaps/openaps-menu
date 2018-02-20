'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var os = require('os');
var fs = require('fs');
var font = require('oled-font-5x7');
var i2cBus = i2c.openSync(1);

// setup the display
var displayConfig = require('/root/src/openaps-menu/config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('/root/src/openaps-menu/lib/display/ssd1306')(displayConfig);

//Parse enacted.json
var enactedjson = fs.readFileSync("/root/myopenaps/enact/enacted.json");
var enacted = JSON.parse(enactedjson);

//Parse glucose.json
var glucosejson = fs.readFileSync("/root/myopenaps/monitor/glucose.json");
var bg = JSON.parse(glucosejson);

//Parse, process, and display battery gauge
display.oled.drawLine(115, 57, 127, 57, 1); //top
display.oled.drawLine(115, 63, 127, 63, 1); //bottom
display.oled.drawLine(115, 57, 115, 63, 1); //left
display.oled.drawLine(127, 57, 127, 63, 1); //right
display.oled.drawLine(114, 59, 114, 61, 1); //iconify
var batteryjson = fs.readFileSync("/root/myopenaps/monitor/edison-battery.json");
var batterylevel = JSON.parse(batteryjson);
var batt = Math.round(127 - (batterylevel.battery / 10));
display.oled.fillRect(batt, 58, 126, 62, 1); //fill battery gauge

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

//bg graph
display.oled.drawLine(5, 51, 5, 21, 1);
display.oled.drawLine(5, 51, 127, 51, 1);
//targets high and low
display.oled.drawLine(2, 30, 5, 30, 1);
display.oled.drawLine(2, 40, 5, 40, 1);

//render BG graph
var x = 5;
var i = 24;
var y = ( 21 - ( ( bg[i].glucose - 350 ) / 10 ) );

while (i >= 0) {
 x = x + 5;
 y = ( 21 - ( ( bg[i].glucose - 350 ) / 10 ) );
 display.oled.drawPixel([x, y, 1]);
 i--;
}

//display BG number
display.oled.setCursor(0,57);
display.oled.writeString(font, 1, bg[0].glucose+" m", 1, true);

//calculate BG age
// ?????

//enacted status
display.oled.setCursor(0,0);
display.oled.writeString(font, 1, 'm ago: '+enacted.duration+'m @ '+enacted.rate+'U/h', 1, true);
