'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var os = require('os');
var fs = require('fs');
var font = require('oled-font-5x7');
var i2cBus = i2c.openSync(1);

// Rounds value to 'digits' decimal places
function round(value, digits)
{
  if (! digits) { digits = 0; }
  var scale = Math.pow(10, digits);
  return Math.round(value * scale) / scale;
}

function convert_bg(value, profile)
{
  if (profile != null && profile.out_units == "mmol/L")
  {
    return round(value / 18, 1).toFixed(1);
  }
  else
  {
    return Math.round(value);
  }
}

function stripLeadingZero(value)
{
  var re = /^(-)?0+(?=[\.\d])/;
  return value.toString().replace( re, '$1');
}

// setup the display
var displayConfig = require('/root/src/openaps-menu/config/display.json');
displayConfig.i2cBus = i2cBus;

//check to see if the display works, exit with error code if it doesn't
try {
    var display = require('/root/src/openaps-menu/lib/display/ssd1306')(displayConfig);
} catch (e) {
    console.error("Could not set up display:\n", e);
    process.exit(1);
}

//dim the display
display.oled.dimDisplay(true);

//Parse all the .json files we need
try {
    var profile = JSON.parse(fs.readFileSync("/root/myopenaps/settings/profile.json"));
} catch (e) {
    // Note: profile.json is optional as it's only needed for mmol conversion for now. Print an error, but not return
    console.error("Could not parse profile.json: ", e);
}
try {
    var batterylevel = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/edison-battery.json"));
} catch (e) {
    console.error("Could not parse edison-battery.json: ", e);
}

if(batterylevel) {
    //Process and display battery gauge
    display.oled.drawLine(116, 57, 127, 57, 1, false); //top
    display.oled.drawLine(116, 63, 127, 63, 1, false); //bottom
    display.oled.drawLine(116, 57, 116, 63, 1, false); //left
    display.oled.drawLine(127, 57, 127, 63, 1, false); //right
    display.oled.drawLine(115, 59, 115, 61, 1, false); //iconify
    var battRect = Math.round(batterylevel.battery / 10);
    var battX = (127 - battRect);
    display.oled.fillRect(battX, 58, battRect, 5, 1, false); //fill battery gauge
}

try {
    var suggested = JSON.parse(fs.readFileSync("/root/myopenaps/enact/suggested.json"));
} catch (e) {
    return console.error("Could not parse suggested.json: ", e);
}
try {
    var bg = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/glucose.json"));
} catch (e) {
    return console.error("Could not parse glucose.json: ", e);
}

//calculate timeago for BG
var startDate = new Date(bg[0].date);
var endDate = new Date();
var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
if (bg[0].delta) {
    var delta = Math.round(bg[0].delta);
} else if (bg[1] && bg[0].date - bg[1].date > 200000 ) {
    var delta = Math.round(bg[0].glucose - bg[1].glucose);
} else if (bg[2] && bg[0].date - bg[2].date > 200000 ) {
    var delta = Math.round(bg[0].glucose - bg[2].glucose);
} else if (bg[3] && bg[0].date - bg[3].date > 200000 ) {
    var delta = Math.round(bg[0].glucose - bg[3].glucose);
} else {
    var delta = 0;
}

//display BG number, add plus sign if delta is positive
display.oled.setCursor(0,0);
if (delta >= 0) {
    display.oled.writeString(font, 3, ""+convert_bg(bg[0].glucose, profile), 1, true, false);
    display.oled.writeString(font, 1, "+"+stripLeadingZero(convert_bg(delta, profile)), 1, true, false);
    display.oled.writeString(font, 2, "  "+minutes+"m", 1, true, false);
} else {
    display.oled.writeString(font, 3, ""+convert_bg(bg[0].glucose, profile), 1, true, false);
    display.oled.writeString(font, 1, ""+stripLeadingZero(convert_bg(delta, profile)), 1, true, false);
    display.oled.writeString(font, 2, "  "+minutes+"m", 1, true, false);
}

//calculate timeago for last successful loop
var stats = fs.statSync("/tmp/pump_loop_success");
var date = new Date(stats.mtime);
var hour = date.getHours();
hour = (hour < 10 ? "0" : "") + hour;
var min  = date.getMinutes();
min = (min < 10 ? "0" : "") + min;

//display last loop time
display.oled.setCursor(0,57);
display.oled.writeString(font, 1, "Last loop at: "+hour+":"+min, 1, true, false);

//files for IOB and COB:
try {
    var iob = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/iob.json"));
} catch (e) {
    return console.error("Could not parse iob.json: ", e);
}

try {
    var cob = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/meal.json"));
} catch (e) {
    return console.error("Could not parse meal.json: ", e);
}

//parse and render COB/IOB
display.oled.setCursor(0,23);
display.oled.writeString(font, 1, "IOB:", 1, true, false);
display.oled.writeString(font, 2, " "+iob[0].iob+'U', 1, true, false);
display.oled.setCursor(0,39);
display.oled.writeString(font, 1, "COB:", 1, true, false);
display.oled.writeString(font, 2, " "+cob.mealCOB+'g', 1, true, false);

//display everything in the buffer
display.oled.update();

//fandomly invert display to evenly wear the OLED diodes
display.oled.invertDisplay((endDate % 2 == 1));
