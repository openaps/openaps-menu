
'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var os = require('os');
var fs = require('fs');
var font = require('oled-font-5x7');
var i2cBus = i2c.openSync(1);

var profile = null;
if ( process.argv.length > 2)
{
  try {
    profile=JSON.parse(fs.readFileSync(process.argv[2]));
  } catch (e) {
    console.error("Could not parse profile.json: ", e);
  }
} 

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
var display = require('/root/src/openaps-menu/lib/display/ssd1306')(displayConfig);

//Parse all the .json files we need
try {
    var suggested = JSON.parse(fs.readFileSync("/root/myopenaps/enact/suggested.json"));
} catch (e) {
    return console.error("Could not parse suggested.json: ", e);
}
try {
    var temp = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/temp_basal.json"));
} catch (e) {
    return console.error("Could not parse temp_basal.json: ", e);
}
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
try {
    var bg = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/glucose.json"));
} catch (e) {
    return console.error("Could not parse glucose.json: ", e);
}
try {
    var batterylevel = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/edison-battery.json"));
} catch (e) {
    console.error("Could not parse edison-battery.json: ", e);
}

if(batterylevel) {
    //Process and display battery gauge
    display.oled.drawLine(115, 57, 127, 57, 1); //top
    display.oled.drawLine(115, 63, 127, 63, 1); //bottom
    display.oled.drawLine(115, 57, 115, 63, 1); //left
    display.oled.drawLine(127, 57, 127, 63, 1); //right
    display.oled.drawLine(114, 59, 114, 61, 1); //iconify
    var batt = Math.round(127 - (batterylevel.battery / 10));
    display.oled.fillRect(batt, 58, 126, 62, 1); //fill battery gauge
}

//Create and render clock
function displayClock() {
  var date=new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  display.oled.setCursor(83, 57);
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
var i = (suggested.predBGs != undefined) ? (72) : (120); //fill the whole graph with BGs if there are no predictions
var x = 5; //start in the right place
for (i; i >= 0; i--) {
    x = x + 1;
    var y = Math.round( 21 - ( ( bg[i].glucose - 250 ) / 8 ) );
    //upper and lower boundaries
    if ( y < 21 ) y = 21;
    if ( y > 51 ) y = 51;
    display.oled.drawPixel([x, y, 1]);
}

//render predictions, only if we have them
if (suggested.predBGs != undefined) {
  //render line between actual BG and predicted
  x = x + 1;
  display.oled.drawLine(x, 51, x, 21, 1);
  //render predictions
  var predictions = [suggested.predBGs.IOB, suggested.predBGs.ZT, suggested.predBGs.UAM, suggested.predBGs.COB];
  x = x - 2;
  for (i = 0; i <= 48; i++) {
      x = x + 1
      for(var n = 0; n <=3 && (predictions[n] != undefined); n++) {
      y = Math.round( 21 - ( (predictions[n][i] - 250 ) / 8) );
      //upper and lower boundaries
      if ( y < 21 ) y = 21;
      if ( y > 51 ) y = 51;
      display.oled.drawPixel([x, y, 1]);
      }
  }
}
//calculate timeago for BG
var startDate = new Date(bg[0].date);
var endDate = new Date();
var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
if (bg[0].delta) {
    var delta = Math.round(bg[0].delta);
} else {
    var delta = Math.round(bg[0].glucose - bg[1].glucose);
}

//display BG number, add plus sign if delta is positive
display.oled.setCursor(0,57);
if (delta >= 0) {
    display.oled.writeString(font, 1, "BG:"+convert_bg(bg[0].glucose, profile)+"+"+stripLeadingZero(convert_bg(delta, profile))+" "+minutes+"m", 1, true);
} else {
    display.oled.writeString(font, 1, "BG:"+convert_bg(bg[0].glucose, profile)+""+stripLeadingZero(convert_bg(delta, profile))+" "+minutes+"m", 1, true);
}

//calculate timeago for status
var stats = fs.statSync("/root/myopenaps/monitor/temp_basal.json");
startDate = new Date(stats.mtime);
endDate = new Date();
minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

//render current temp basal
display.oled.setCursor(0,0);
var tempRate = Math.round(temp.rate*10)/10;
display.oled.writeString(font, 1, "TB: "+temp.duration+'m '+tempRate+'U/h '+'('+minutes+'m ago)', 1);

//parse and render COB/IOB
display.oled.setCursor(0,8);
display.oled.writeString(font, 1, "COB: "+cob.mealCOB+"g  IOB: "+iob[0].iob+'U', 1, true);
