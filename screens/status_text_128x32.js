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
  display.oled.setCursor(0,14);
  display.oled.writeString(font, 2, ""+convertBg(bg[0].glucose, profile), 1, false, 0, false);
    
	// display BG trend arrow (or if old, cross bg and show age in min)
	var curPos = display.oled.cursor_x + 1 ;
    if (minutes >= 11 ){
      display.oled.fillRect(0, 20, curPos, 3, 1, false);
      
      display.oled.setCursor(curPos+5,13);
      display.oled.writeString(font, 1, minutes+"'", 1, false, 0, false);      
	    //curPos = display.oled.cursor_x + 1 ;
      //display.oled.fillRect(curPos, 15, 1, 3, 1, false);
    } else if (delta) {
      if (delta >= 5) {
        drawArrowUp(display, curPos+3, 12);
      } else if ( delta <= -5){
        drawArrowDown(display, curPos+3, 12);
      }
      if (delta >= 10) {
        drawArrowUp(display, curPos+10, 12);
      } else if ( delta <= -10){
        drawArrowDown(display, curPos+10, 12);
      }
    }
}

//display IOB
if(iob) {
  var iob = round(iob[0].iob, 1).toFixed(1);
  var xOffset = 55;
  if (iob > 0) {
    xOffset += 6;  
  }
	if (Math.abs(iob) < 10.0) {
    xOffset += 6;
	}
  display.oled.setCursor(xOffset,13);
  display.oled.writeString(font, 1, iob+"U", 1, false, 0, false);
}

// display COB
if(cob) {
  var xOffset = 61;
	if (Math.abs(iob) < 10.0) {
    xOffset += 6;
	}
  display.oled.setCursor(xOffset,22);
	display.oled.writeString(font, 1, round(cob.mealCOB, 1).toFixed(1)+"g", 1, false, 0, false);
}

//calculate timeago for last successful loop
if(loopSuccess) {
  var startDate = new Date(loopSuccess.mtime);
  var endDate = new Date();
  var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

  //display last loop time
  if (status.suspended == true){
	drawLoopIcon(display,95,12,true,true);
  } else if (minutes > 9){
	drawLoopIcon(display,95,12,true);
  } else{
	drawLoopIcon(display,95,12,false);
	display.oled.setCursor(116,15);
	display.oled.writeString(font, 2, minutes+"'", 1, false, 0, false);
  }
} else {
  drawLoopIcon(display,95,12,true);
}

//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //


