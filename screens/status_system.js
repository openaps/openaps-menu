// scripts/status_system.js
// System screen for system related information
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */


'use strict';

var fs = require('fs');
var font = require('oled-font-5x7');

var round = require('../lib/utils/utils.js').round;
var convertBg= require('../lib/utils/utils.js').convertBg;
var stripLeadingZero= require('../lib/utils/utils.js').stripLeadingZero;

var drawReservoirIcon = require('../lib/utils/utils.js').drawReservoirIcon;
var drawBatteryIcon = require('../lib/utils/utils.js').drawBatteryIcon;
var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;


//
//Start of status display function
//

module.exports = systemStatus;
function systemStatus(display, openapsDir) {

//clear display buffer
display.oled.clearDisplay(true); 

//
// BEGIN Symbol Line (from left to right)
//
try {
    var pumpBatterylevel = JSON.parse(fs.readFileSync(openapsDir+"/monitor/battery.json"));
} catch (e) {
    console.error("Status screen display error: could not parse battery.json: ", e);
}
try {
    var reservoir = JSON.parse(fs.readFileSync(openapsDir+"/monitor/reservoir.json"));
} catch (e) {
    console.error("Status screen display error: could not parse reservoir.json: ", e);
}
try{
	var publicIp = fs.existsSync('/tmp/hasPublicIp')
} catch (e) {
	
}
try {
    var batterylevel = JSON.parse(fs.readFileSync(openapsDir+"/monitor/edison-battery.json"));
} catch (e) {
    console.error("Status screen display error: could not parse edison-battery.json: ", e);
}

// show pump battery level
if(pumpBatterylevel && pumpBatterylevel.voltage) { 
  // set your battery voltage here
  var voltageHigh = 1.7;
  var voltageLow = 1.4;
  
  var battlevel = ((pumpBatterylevel.voltage - voltageLow) / (voltageHigh - voltageLow)) * 100.0;
  battlevel = (battlevel > 100 ? 100 : battlevel);    
  drawBatteryIcon(display, 0, 0 ,battlevel);
} else {
  drawBatteryIcon(display, 0, 0 ,-1);
}

// show pump reservoir icon
if (reservoir){
  drawReservoirIcon(display, 22, 0, reservoir);
} else {
  drawReservoirIcon(display, 22, 0, -1);
}

// show current time
var nowDate = new Date();
var hour = nowDate.getHours();
hour = (hour < 10 ? "0" : "") + hour;
var min  = nowDate.getMinutes();
min = (min < 10 ? "0" : "") + min;

display.oled.setCursor(50,1);
display.oled.writeString(font, 1, hour+":"+min, 1, false, 0, false);

// Bluetooth Icon (for Logger conneciton? or bt teathering?)
// TODO implement
// drawBTIcon(display, 101, 0);

// show online connection icon if connected to wifi
// TODO maybe split BT and WiFi later ...
if (publicIp){
  drawWiFiIcon(display, 86, 0);
} 

// show local battery level
if(batterylevel) {
  drawBatteryIcon(display, 113, 0 , batterylevel.battery);
} else {
  drawBatteryIcon(display, 113, 0 ,-1);
}
//
// END Symbol Line
//

//
// BEGIN System Status
//

 //
}//End of status display function
 //
