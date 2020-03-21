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

// display BG and trend
if(bg && profile) {
	// calculate BG age
    var startDate = new Date(bg[0].date);
    var endDate = new Date();
    var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
	
	// calculate delta
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

    //display BG number
    display.oled.setCursor(0,16);
    display.oled.writeString(font, 3, ""+convertBg(bg[0].glucose, profile), 1, false, 0, false);
    
	// display BG trend arrow (or if old, cross bg and show age in min)
	var curPos = display.oled.cursor_x + 1 ;
    if (minutes >= 11 ){
      display.oled.fillRect(0, 25, curPos, 3, 1, false);
      
      display.oled.setCursor(curPos+5,16);
      display.oled.writeString(font, 1, minutes+"'", 1, false, 0, false);      
	    //curPos = display.oled.cursor_x + 1 ;
      //display.oled.fillRect(curPos, 15, 1, 3, 1, false);
    } else if (delta) {
      if (delta >= 5) {
        drawArrowUp(display, curPos+3, 18);
      } else if ( delta <= -5){
        drawArrowDown(display, curPos+3, 18);
      }
      if (delta >= 10) {
        drawArrowUp(display, curPos+10, 18);
      } else if ( delta <= -10){
        drawArrowDown(display, curPos+10, 18);
      }
    }
}

//display IOB
if(iob) {
  display.oled.setCursor(85,13); //39
  var iob = round(iob[0].iob, 1).toFixed(1);
  if (iob >= 10.0) {
    display.oled.setCursor(95,13);
    iob = round(iob);
  }
  display.oled.writeString(font, 2, iob+"U", 1, false, 0, false);
}

// display COB
if(cob) {
	if (cob.mealCOB >= 10.0) {
		display.oled.setCursor(99,31);
	} else {
		display.oled.setCursor(105,31);
	}
	display.oled.writeString(font, 1, round(cob.mealCOB, 1).toFixed(1)+"g", 1, false, 0, false);
}

// display target (or tmpTarget if set)
if (tmpTarget && tmpTarget[0].remainingDuration && tmpTarget[0].remainingDuration > 0){
  var target = tmpTarget[0].targetBottom.toString()+'('+tmpTarget[0].remainingDuration+')';
} else if (profile && profile.min_bg){
  var target = profile.min_bg.toString();
}
if (target){
	drawTargetIcon(display,0,42);
	display.oled.setCursor(9,43);
	display.oled.writeString(font, 1, target, 1, false, 0, false);
}

// show tmp basal info
if(tmpBasal) {
  display.oled.setCursor(0,55);
  display.oled.writeString(font, 1, "tB "+round(tmpBasal.rate,1).toFixed(1)+"U("+tmpBasal.duration+")", 1, false, 0, false);
}

//calculate timeago for last successful loop
if(loopSuccess) {
  var startDate = new Date(loopSuccess.mtime);
  var endDate = new Date();
  var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

  //display last loop time
  if (status.suspended == true){
	drawLoopIcon(display,95,44,true,true);
  } else if (minutes > 9){
	drawLoopIcon(display,95,44,true);
  } else{
	drawLoopIcon(display,95,44,false);
	display.oled.setCursor(116,47);
	display.oled.writeString(font, 2, minutes+"'", 1, false, 0, false);
  }
} else {
  drawLoopIcon(display,95,44,true);
}

//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //


