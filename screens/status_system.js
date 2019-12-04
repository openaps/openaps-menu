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
var drawConnectIcon = require('../lib/utils/utils.js').drawConnectIcon;
const execSync = require('child_process').execSync;

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
	var hasPublicIp = fs.existsSync('/tmp/hasPublicIp');
} catch (e) {
	// not online
  console.log('No "/tmp/hasPublicIp" found. Not online?');
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

//
// BEGIN System Status
//
try {
	var hostname = execSync('echo $(hostname)').toString().trim();
} catch (e){
	console.error("Status screen display error: could not execute hostname: ", e);
}
try {
	var wifiName = execSync('iwgetid -r').toString();
} catch (e){
	console.error("Status screen display error: could not execute wifiName: ", e);
}
try {
  if (hasPublicIp) 
	  var publicIp = fs.readFileSync('/tmp/hasPublicIp');
} catch (e) {
	console.error("Status screen display error: could not parse /tmp/hasPublicIp: ", e);
}
try {
    var status = JSON.parse(fs.readFileSync(openapsDir+"/monitor/status.json"));
} catch (e) {
    console.error("Status screen display error: could not parse status.json: ", e);
}
try {
    var suggested = JSON.parse(fs.readFileSync(openapsDir+"/enact/suggested.json"));
} catch (e) {
    console.error("Status screen display error: could not parse suggested.json: ", e);
}

var yOffset = 16;
const lineSize = 10;
// show loop related status problems
if (status && suggested) {
    var notLoopingReason = suggested.reason;
    display.oled.setCursor(0,yOffset);
    if (status.suspended == true) {
        display.oled.writeString(font, 1, "PUMP SUSPENDED", 1, false, 0, false);
        yOffset += lineSize;
    }
    else if (notLoopingReason.includes("CGM is calibrating")) {
        display.oled.writeString(font, 1, "CGM calib./???/noisy", 1, false, 0, false);
        yOffset += lineSize;
    }
    else if (notLoopingReason.includes("CGM data is unchanged")) {
        display.oled.writeString(font, 1, "CGM data unchanged", 1, false, 0, false);
        yOffset += lineSize;
    }
    else if (notLoopingReason.includes("BG data is too old")) {
        display.oled.writeString(font, 1, "BG data too old", 1, false, 0, false);
        yOffset += lineSize;
    }
    else if (notLoopingReason.includes("currenttemp rate")) {
        display.oled.writeString(font, 1, "Temp. mismatch", 1, false, 0, false);
        yOffset += lineSize;
    }
    else if (suggested.carbsReq) {
        display.oled.writeString(font, 1, "Carbs Required: "+suggested.carbsReq+'g', 1, false, 0, false);
        yOffset += lineSize;
    } 
	
	else {
		display.oled.writeString(font, 1, "no error ", 1, false, 0, false);
	}
//add more on-screen warnings/messages, maybe some special ones for xdrip-js users?
}

if (hostname){
    display.oled.setCursor(0,yOffset);
	display.oled.writeString(font, 1, "/> "+hostname, 1, false, 0, false);
	yOffset += lineSize;
}

if (wifiName){
  if (wifiIp){
	  drawWiFiIcon(display,0,yOffset+4);
  } else {
	  drawWiFiIcon(display,0,yOffset-1);
  }
  display.oled.setCursor(12,yOffset);
	display.oled.writeString(font, 1, wifiName, 1, false, 0, false);
	yOffset += lineSize;
}

if (wifiIp){
	if (!wifiName){
    drawWiFiIcon(display,0,yOffset-1);
  }
  display.oled.setCursor(12,yOffset);
	display.oled.writeString(font, 1, wifiIp, 1, false, 0, false);
	yOffset += lineSize;
}

if (btIp){
	drawBTIcon(display,0,yOffset);
    display.oled.setCursor(4,yOffset);
	display.oled.writeString(font, 1, wifiIp, 1, false, 0, false);
	yOffset += lineSize;
}

if (publicIp){
    display.oled.setCursor(0,yOffset);
	display.oled.writeString(font, 1, "pIP:"+publicIp, 1, false, 0, false);
	yOffset += lineSize;
}


//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //
