// screens/status_text.js
// Text based APS status screen 
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

var drawSymbolLine = require('./symbol_line.js');

var drawArrowUp = require('../lib/utils/utils.js').drawArrowUp;
var drawArrowDown = require('../lib/utils/utils.js').drawArrowDown;
var drawLoopIcon = require('../lib/utils/utils.js').drawLoopIcon;
var drawTargetIcon = require('../lib/utils/utils.js').drawTargetIcon;

//
//Start of status display function
//

module.exports = textStatus;
function textStatus(display, openapsDir, pumpPref) {
//clear the buffer
display.oled.clearDisplay(true);

drawSymbolLine(display, openapsDir, pumpPref);

//
// BEGIN Text Status
//
try{
    var profile = JSON.parse(fs.readFileSync(openapsDir+"/settings/profile.json"));
} catch (e) {
    // Note: profile.json is optional as it's only needed for mmol conversion for now. Print an error, but not return
    console.error("Status screen display error: could not parse profile.json: ", e);
}
try {
    var tmpBasal = JSON.parse(fs.readFileSync(openapsDir+"/monitor/temp_basal.json"));
} catch (e) {
    console.error("Status screen display error: could not parse temp_basal.json");
}
try {
    var tmpTarget = JSON.parse(fs.readFileSync(openapsDir+"/settings/local-temptargets.json"));
    tmpTarget.sort(function(a, b){
      var keyA = new Date(a.created_at),
          keyB = new Date(b.created_at);
      // Compare the 2 dates
      if(keyA < keyB) return 1;
      if(keyA > keyB) return -1;
      return 0;
    });
    if (tmpTarget[0] && tmpTarget[0].created_at){
      var remainingDuration = Math.round(((new Date(tmpTarget[0].created_at).getTime() + tmpTarget[0].duration * 60000) - Date.now()) / 60000);
      tmpTarget[0].remainingDuration = remainingDuration;
    }
} catch (e) {
    console.error("Status screen display error: could not parse local-temptargets.json");
}
try {
    var status = JSON.parse(fs.readFileSync(openapsDir+"/monitor/status.json"));
} catch (e) {
    console.error("Status screen display error: could not parse status.json: ", e);
}

// display target (or tmpTarget if set)
if (tmpTarget && tmpTarget[0].remainingDuration && tmpTarget[0].remainingDuration > 0){
  var target = tmpTarget[0].targetBottom.toString()+'('+tmpTarget[0].remainingDuration+')';
} else if (profile && profile.min_bg){
  var target = profile.min_bg.toString();
}
if (target){
	drawTargetIcon(display,0,11);
	display.oled.setCursor(9,12);
	display.oled.writeString(font, 1, target, 1, false, 0, false);
}

// show tmp basal info
if(tmpBasal) {
  var rate = round(tmpBasal.rate,1).toFixed(1);
  var xOffset = 51;
	if (rate < 10.0) {
    xOffset += 6;
	}
  if (tmpBasal.duration < 100){
    xOffset += 6;
  }
  if (tmpBasal.duration < 10){
    xOffset += 6;
  }
  display.oled.setCursor(xOffset,13);
  display.oled.writeString(font, 1, "tB "+rate+"U("+tmpBasal.duration+")", 1, false, 0, false);
}

// show loop related status problems
display.oled.setCursor(0,22);
if (status && status.suspended == true) {
        display.oled.writeString(font, 1, "PUMP SUSPENDED", 1, false, 0, false);
} else if (suggested) {    
  var notLoopingReason = suggested.reason;    
  if (notLoopingReason.includes("CGM is calibrating")) {
      display.oled.writeString(font, 1, "CGM calib./???/noisy", 1, false, 0, false);
  }
  else if (notLoopingReason.includes("CGM data is unchanged")) {
      display.oled.writeString(font, 1, "CGM data unchanged", 1, false, 0, false);
  }
  else if (notLoopingReason.includes("BG data is too old")) {
      display.oled.writeString(font, 1, "BG data too old", 1, false, 0, false);
  }
  else if (notLoopingReason.includes("currenttemp rate")) {
      display.oled.writeString(font, 1, "Temp. mismatch", 1, false, 0, false);
  }
  else if (suggested.carbsReq) {
      display.oled.writeString(font, 1, "Carbs Required: "+suggested.carbsReq+'g', 1, false, 0, false);
  }
}
//add more on-screen warnings/messages, maybe some special ones for xdrip-js users?




//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //


