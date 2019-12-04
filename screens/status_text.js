// scripts/status_text.js
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

var drawReservoirIcon = require('../lib/utils/utils.js').drawReservoirIcon;
var drawBatteryIcon = require('../lib/utils/utils.js').drawBatteryIcon;
var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;
var drawConnectIcon = require('../lib/utils/utils.js').drawConnectIcon;

var drawArrowUp = require('../lib/utils/utils.js').drawArrowUp;
var drawArrowDown = require('../lib/utils/utils.js').drawArrowDown;
var drawLoopIcon = require('../lib/utils/utils.js').drawLoopIcon;
var drawTargetIcon = require('../lib/utils/utils.js').drawTargetIcon;
const execSync = require('child_process').execSync;


//
//Start of status display function
//

module.exports = textStatus;
function textStatus(display, openapsDir) {
//clear the buffer
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
    var stats = fs.statSync("/tmp/pump_loop_success");
} catch (e) {
    console.error("Status screen display error: could not find pump_loop_success");
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
    
	// display BG trend arrow (or cross if old)
	var curPos = display.oled.cursor_x + 1 ;
    if (minutes >= 11 ){
      display.oled.fillRect(0, 25, curPos, 3, 1, false);
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
	if (iob >= 10.0) {
		display.oled.setCursor(100,31);
	} else {
		display.oled.setCursor(105,31);
	}
	display.oled.writeString(font, 1, round(cob.mealCOB, 1).toFixed(1)+"g", 1, false, 0, false);
}

// display target
if (profile && profile.min_bg){
	drawTargetIcon(display,0,42);
	display.oled.setCursor(9,43);
	display.oled.writeString(font, 1, profile.min_bg.toString() , 1, false, 0, false);
}

// show tmp basal info
if(tmpBasal) {
  display.oled.setCursor(0,55);
  display.oled.writeString(font, 1, "tB "+round(tmpBasal.rate,1).toFixed(1)+"U("+tmpBasal.duration+")", 1, false, 0, false);
}

//calculate timeago for last successful loop
if(stats) {
  var startDate = new Date(stats.mtime);
  var endDate = new Date();
  var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

  //display last loop time
  if (minutes > 9){
	drawLoopIcon(display,95,44,true);
  } else{
	drawLoopIcon(display,95,44,false);
	display.oled.setCursor(116,47);
	display.oled.writeString(font, 2, ''+minutes, 1, false, 0, false);
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


