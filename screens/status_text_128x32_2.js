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
    var bg = JSON.parse(fs.readFileSync(openapsDir+"/monitor/glucose.json"));
} catch (e) {
    console.error("Status screen display error: could not parse glucose.json: ", e);
}
try {
    var iob = JSON.parse(fs.readFileSync(openapsDir+"/monitor/iob.json"));
} catch (e) {
    console.error("Status screen display error: could not parse iob.json: ", e);
}
try {
    var cob = JSON.parse(fs.readFileSync(openapsDir+"/monitor/meal.json"));
} catch (e) {
    console.error("Status screen display error: could not parse meal.json: ", e);
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
    var loopSuccess = fs.statSync("/tmp/pump_loop_success");
} catch (e) {
    console.error("Status screen display error: could not find pump_loop_success");
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
	drawTargetIcon(display,0,13);
	display.oled.setCursor(9,14);
	display.oled.writeString(font, 1, target, 1, false, 0, false);
}

// show tmp basal info
if(tmpBasal) {
  display.oled.setCursor(0,22);
  display.oled.writeString(font, 1, "tB "+round(tmpBasal.rate,1).toFixed(1)+"U("+tmpBasal.duration+")", 1, false, 0, false);
}

//calculate timeago for last successful loop
if(loopSuccess) {
  var startDate = new Date(loopSuccess.mtime);
  var endDate = new Date();
  var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

  //display last loop time
  if (status.suspended == true){
	drawLoopIcon(display,95,13,true,true);
  } else if (minutes > 9){
	drawLoopIcon(display,95,13,true);
  } else{
	drawLoopIcon(display,95,13,false);
	display.oled.setCursor(116,15);
	display.oled.writeString(font, 2, minutes+"'", 1, false, 0, false);
  }
} else {
  drawLoopIcon(display,95,13,true);
}

//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //


