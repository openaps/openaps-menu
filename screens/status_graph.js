// screens/status_graph.js
// Graph screen for cgm and bolus information  
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

var drawDot = require('../lib/utils/utils.js').drawDot;


//
//Start of status display function
//

module.exports = graphicalStatus;
function graphicalStatus(display, openapsDir) {
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
// BEGIN Graph Status
//
try {
    var profile = JSON.parse(fs.readFileSync(openapsDir+"/settings/profile.json"));
} catch (e) {
    console.error("Status screen display error: could not parse profile.json: ", e);
}
try {
    var pumpHistory = JSON.parse(fs.readFileSync(openapsDir+"/monitor/pumphistory-24h-zoned.json"));
} catch (e) {
    console.error("Status screen display error: could not parse pumphistory-24h-zoned.json: ", e);
}
try {
    var carbHistory = JSON.parse(fs.readFileSync(openapsDir+"/monitor/carbhistory.json"));
} catch (e) {
    console.error("Status screen display error: could not parse pumphistory-24h-zoned.json: ", e);
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
    var bg = JSON.parse(fs.readFileSync(openapsDir+"/monitor/glucose.json"));
} catch (e) {
    console.error("Status screen display error: could not parse glucose.json: ", e);
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



//display bg graph axes
display.oled.drawLine(0, 16, 0, 63, 1, false);
display.oled.drawLine(1, 63, 127, 63, 1, false);

//display target range
// 16 to 62 is drawing line for BG 30 to 250
// --> BG range 220 => pixel 46
// --> 5mg/dl per pixel
var targetLow = 48; // 70/5=14 -> 62-14=48
var targetHigh = 27; // 180/5=35 -> 62-35=27
display.oled.drawLine(1, targetHigh, 2, targetHigh, 1, false);
display.oled.drawLine(1, targetLow, 2, targetLow, 1, false);


// draw line for target (or tmpTarget if set)
if (tmpTarget && tmpTarget[0].remainingDuration && tmpTarget[0].remainingDuration > 0){
  var target = 62-tmpTarget[0].targetBottom/5;
} else if (profile && profile.min_bg){
  var target = 62-profile.min_bg/5;
}
if (target){
  var x0 = 1;
  for (var i=0; i<125;i+=6){
    display.oled.drawLine(x0+i, target, x0+i+1, target, 1, false);
  }
}

//render BG graph
var ylons = []; // save y values of BGs for later use
if (bg) {
	//fill the whole graph with BGs if there are no predictions
    var numBGs = ((suggested != undefined) && (suggested.predBGs != undefined)) ? (72) : (120);
    var zerotime = Date.now() - ((numBGs * 5) * 600);
    var zero_x = numBGs + 5;
	var lastX = zero_x
    for (var i = 0; i < bg.length; i++) {
        if (bg[i] != null) {
			var x = zero_x + Math.round(((((bg[i].date - zerotime)/1000)/60)/5));
			// left and right boundaries
			if (x < 1) break;
			if ( x > 127 ) x = 127;
			
            var y = Math.round( 62 - (bg[i].glucose/5) );
            //upper and lower boundaries
            if ( y < 16 ) y = 16;
            if ( y > 60 ) y = 60;
			
			// save y for this x if not already
			if (lastX !== x){
				ylons.push(y);
				lastX = x;
			}
			
            display.oled.drawPixel([x, y, 1], false);
        }
    }

	//render predictions on the graph, but only if we have them
	if (suggested && suggested.predBGs != undefined) {
		//render line between actual BG and predicted
		x = zero_x + 1;
		display.oled.drawLine(x, 16, x, 63, 1, false);
		// render target range indicatior
		display.oled.drawLine(x-1, targetHigh, x-2, targetHigh, 1, false);
		display.oled.drawLine(x-1, targetLow, x-2, targetLow, 1, false);
		//render predictions
		var predictions = [suggested.predBGs.IOB, suggested.predBGs.ZT, suggested.predBGs.UAM, suggested.predBGs.COB];
		for (i = 0; i <= 48; i++) {
			x++;
			for(var n = 0; n < 4 && (predictions[n] != undefined); n++) {
				y = Math.round( (21) - ( (predictions[n][i] - 250 ) / 8) );
				//right boundary
				if ( x > 127 ) x = 127;
				//upper and lower boundaries
				if ( y < (21) ) y = (21);
				if ( y > (51) ) y = (51);
				display.oled.drawPixel([x, y, 1, false]);
			}
		}
	} else {
		// draw additional x axis with target range indicator if suggestion is not available
		x = 127;
		display.oled.drawLine(x, 16, x, 63, 1, false);
		display.oled.drawLine(x-1, targetHigh, x-2, targetHigh, 1, false);
		display.oled.drawLine(x-1, targetLow, x-2, targetLow, 1, false);
	}
}

// render bolus "injections"
if (pumpHistory){
	var numBGs = (numBGs) ? numBGs : 120;
    var zerotime = (zerotime) ? zerotime : Date.now() - ((numBGs * 5) * 600);
    var zero_x = numBGs + 5;
	
    for (var i = 0; i < pumpHistory.length; i++) {
        if (pumpHistory[i] !== null 
			&& pumpHistory[i]._type !== null
			&& pumpHistory[i]._type.toLowerCase() === "bolus") {
				var bolus = pumpHistory[i].amount;
				var bolusDate = new Date(pumpHistory[i].timestamp);
            
				var x = zero_x + Math.round(((((bolusDate - zerotime)/1000)/60)/5));
				if (x < 1) break;
				if ( x > 127 ) x = 127;
				
				// print bolus but smb a bit smaller
				if (bolus > 1){
					display.oled.fillRect(x, 58, 2, 5, 1, false);
				} else {
					display.oled.fillRect(x, 61, 2, 2, 1, false);
				}
        }
    }
}

// render meals
ylons = ylons.reverse();
if (carbHistory){
	var numBGs = (numBGs) ? numBGs : 120;
    var zerotime = (zerotime) ? zerotime : Date.now() - ((numBGs * 5) * 600);
    var zero_x = numBGs + 5;
	
	for (var i = 0; i < carbHistory.length; i++) {
		if (carbHistory[i] !== null 
			&& carbHistory[i].carbs !== null
			&& carbHistory[i].carbs > 0) {
				var carbDate = new Date(carbHistory[i].timestamp);
				var x = zero_x + Math.round(((((carbDate - zerotime)/1000)/60)/5));
				if (x < 1) break;
				if ( x > 127 ) x = 127;
				console.log(x)

				var y = (ylons[x-1] != null) ? ylons[x-1] : 16;
				if (y < 20) y = 25; // when value is high, place carbs in the middle to make them visible
        
				drawDot(display,x, y);
		}
	}
}

//dim the display
display.oled.dimDisplay(true); 
//write buffer to the screen
display.oled.update(); 

 //
}//End of status display function
 //
