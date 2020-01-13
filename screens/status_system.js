// screens/status_system.js
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

var drawSymbolLine = require('./symbol_line.js');

var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;
var drawConnectIcon = require('../lib/utils/utils.js').drawConnectIcon;
const execSync = require('child_process').execSync;

//
//Start of status display function
//

// wipe bottom line for error messages if already written
function wipeIfAlreadyUsed(display, yOffset){
  if (yOffset >= 56){
    yOffset = 56;
    display.oled.fillRect(0, yOffset, 128, 10,  0, false);  
  }
  display.oled.setCursor(0,yOffset);
}

module.exports = systemStatus;
function systemStatus(display, openapsDir, pumpPref) {

//clear display buffer
display.oled.clearDisplay(true); 

drawSymbolLine(display, openapsDir, pumpPref);

//
// BEGIN System Status
//
try {
	var hostname = execSync('echo $(hostname)').toString().trim();
} catch (e){
	console.error("Status screen display error: could not execute hostname: ", e);
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
	var wifiName = execSync('iwgetid -r').toString().trim();
} catch (e){
	console.error("Status screen display error: could not execute wifiName: ", e);
}
try{
	var hasPublicIp = fs.existsSync('/tmp/publicIP');
} catch (e) {
	// not online
  console.log('No "/tmp/publicIP" found. Not online?');
}
try {
  if (hasPublicIp) 
	  var publicIp = fs.readFileSync('/tmp/publicIP').toString().trim();
} catch (e) {
	console.error("Status screen display error: could not parse /tmp/publicIP: ", e);
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
try {
	var usbIp = execSync('ip -f inet -o addr show usb0|cut -d " " -f 7 |cut -d "/" -f 1').toString().trim();
} catch (e){
	console.error("Status screen display error: could not execute wifiIp: ", e);
}

var yOffset = 16;
const lineSize = 10;

/*
if (hostname){
    display.oled.setCursor(0,yOffset);
	display.oled.writeString(font, 1, "/> "+hostname, 1, false, 0, false);
	yOffset += lineSize;
}
*/

if (usbIp){
  if (hostname){
    drawConnectIcon(display, 0,yOffset+5, true);
    display.oled.setCursor(13,yOffset);
    display.oled.writeString(font, 1, hostname+'.local', 1, false, 0, false);
    yOffset += lineSize;
  } else {
    drawConnectIcon(display, 0,yOffset, true);
  }
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, usbIp, 1, false, 0, false);
	yOffset += lineSize;
}

if (wifiName){
  if (wifiIp){
	  drawWiFiIcon(display,0,yOffset+4);
  } else {
	  drawWiFiIcon(display,0,yOffset-1);
  }
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, wifiName, 1, false, 0, false);
	yOffset += lineSize;
}

if (wifiIp){
	if (!wifiName){
    drawWiFiIcon(display,0,yOffset-1);
  }
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, wifiIp, 1, false, 0, false);
	yOffset += lineSize;
}

// wifi AP mode

if (btIp){
	drawBTIcon(display,0,yOffset);
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, wifiIp, 1, false, 0, false);
	yOffset += lineSize;
}

if (publicIp){
  drawConnectIcon(display, 0,yOffset, true);
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, publicIp, 1, false, 0, false);
	yOffset += lineSize;
} 

if (yOffset === 16){
  // no network information shown
  drawConnectIcon(display, 0,yOffset, false);
  display.oled.setCursor(13,yOffset);
	display.oled.writeString(font, 1, "No network connection.", 1, false, 0, false);
	yOffset += lineSize;
}

// show loop related status problems
if (status) {
    var notLoopingReason = suggested.reason;
    if (status.suspended == true) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "PUMP SUSPENDED", 1, false, 0, false);
    }
    else if (notLoopingReason.includes("CGM is calibrating")) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "CGM calib./???/noisy", 1, false, 0, false);
    }
    else if (notLoopingReason.includes("CGM data is unchanged")) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "CGM data unchanged", 1, false, 0, false);
    }
    else if (notLoopingReason.includes("BG data is too old")) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "BG data too old", 1, false, 0, false);
    }
    else if (notLoopingReason.includes("currenttemp rate")) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "Temp. mismatch", 1, false, 0, false);
    }
    else if (suggested.carbsReq) {
        wipeIfAlreadyUsed(display, yOffset);
        display.oled.writeString(font, 1, "Carbs Required: "+suggested.carbsReq+'g', 1, false, 0, false);
    }
//add more on-screen warnings/messages, maybe some special ones for xdrip-js users?
}

//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //
