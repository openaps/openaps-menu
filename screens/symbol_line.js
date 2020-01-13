// screens/symbol_line.js
// Text based APS status screen 
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

var fs = require('fs');
var font = require('oled-font-5x7');

var drawReservoirIcon = require('../lib/utils/utils.js').drawReservoirIcon;
var drawBatteryIcon = require('../lib/utils/utils.js').drawBatteryIcon;
var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;
var drawConnectIcon = require('../lib/utils/utils.js').drawConnectIcon;
const execSync = require('child_process').execSync;

module.exports = drawSymbolLine;
function drawSymbolLine(display, openapsDir, pumpPref){
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
	var hasPublicIp = fs.existsSync('/tmp/publicIP');
} catch (e) {
	// not online
  console.log('No "/tmp/publicIP" found. Not online?');
}
try {
	var wifiIp = execSync('ip -f inet -o addr show wlan0|cut -d " " -f 7 |cut -d "/" -f 1').toString();
} catch (e){
	console.error("Status screen display error: could not execute wifiIp: ", e);
}
try {
	var btIp = execSync('ip -f inet -o addr show bnep0|cut -d " " -f 7 |cut -d "/" -f 1').toString();
} catch (e){
	console.error("Status screen display error: could not execute btIp: ", e);
}
try {
    var batterylevel = JSON.parse(fs.readFileSync(openapsDir+"/monitor/edison-battery.json"));
} catch (e) {
    console.error("Status screen display error: could not parse edison-battery.json: ", e);
}

// show pump battery level
if(pumpPref && pumpBatterylevel && pumpBatterylevel.voltage) { 
  // set your battery voltage here
  var voltageHigh = pumpPref.pumpBatteryTypes[pumpPref.pumpBatteryIndex].high;
  var voltageLow = pumpPref.pumpBatteryTypes[pumpPref.pumpBatteryIndex].low;
  
  var battlevel = ((pumpBatterylevel.voltage - voltageLow) / (voltageHigh - voltageLow)) * 100.0;
  battlevel = (battlevel > 100 ? 100 : battlevel);
  battlevel = (battlevel < 0 ? 0 : battlevel);
  drawBatteryIcon(display, 0, 0, battlevel);
} else {
  drawBatteryIcon(display, 0, 0 ,-1);
}

// show pump reservoir icon
if (pumpPref && reservoir){
  reservoir = reservoir / (pumpPref.pumpReservoirSize / 100);
  reservoir = (reservoir > 100 ? 100 : reservoir);
  reservoir = (reservoir < 0 ? 0 : reservoir);
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

display.oled.setCursor(48,1);
display.oled.writeString(font, 1, hour+":"+min, 1, false, 0, false);


// show online connection icon if connected to the Internet
// TODO or WiFi AP icon if AP mode active
if (hasPublicIp){
  drawConnectIcon(display, 82, 1, true);
} else {
  drawConnectIcon(display, 82, 1, false);
}

// show WiFi icon if connected to a Wifi network or Bluetooth icon if connected to a PAN
if (wifiIp){
  drawWiFiIcon(display, 98, 0);
} else if (btIp){
  drawBTIcon(display, 99, 0);
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
}