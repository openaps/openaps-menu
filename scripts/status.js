var fs = require('fs');
var font = require('oled-font-5x7');

// Rounds value to 'digits' decimal places
function round(value, digits)
{
  if (! digits) { digits = 0; }
  var scale = Math.pow(10, digits);
  return Math.round(value * scale) / scale;
}

function convert_bg(value, profile)
{
  if (profile != null && profile.out_units == "mmol/L")
  {
    return round(value / 18, 1).toFixed(1);
  }
  else
  {
    return Math.round(value);
  }
}

function stripLeadingZero(value)
{
  var re = /^(-)?0+(?=[\.\d])/;
  return value.toString().replace( re, '$1');
}

module.exports = graphicalStatus;

//
//Start of status display function
//

function graphicalStatus(display, openapsDir) {

display.oled.clearDisplay(true); //clear display buffer

//Parse all the .json files we need
try {
    var profile = JSON.parse(fs.readFileSync(openapsDir+"/settings/profile.json"));
} catch (e) {
    console.error("Status screen display error: could not parse profile.json: ", e);
}
try {
    var batterylevel = JSON.parse(fs.readFileSync(openapsDir+"/monitor/edison-battery.json"));
} catch (e) {
    console.error("Status screen display error: could not parse edison-battery.json: ", e);
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
    var temp = JSON.parse(fs.readFileSync(openapsDir+"/monitor/last_temp_basal.json"));
    var statusStats = fs.statSync(openapsDir+"/monitor/last_temp_basal.json");
} catch (e) {
    console.error("Status screen display error: could not parse last_temp_basal.json: ", e);
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

//Process and display battery gauge
if(batterylevel) {
    display.oled.drawLine(116, 57, 127, 57, 1, false); //top
    display.oled.drawLine(116, 63, 127, 63, 1, false); //bottom
    display.oled.drawLine(116, 57, 116, 63, 1, false); //left
    display.oled.drawLine(127, 57, 127, 63, 1, false); //right
    display.oled.drawLine(115, 59, 115, 61, 1, false); //make it look like a battery
    var batt = Math.round(batterylevel.battery / 10);
    display.oled.fillRect(127-batt, 58, batt, 5, 1, false); //fill battery gauge
}

//display warning messages, and move the graph to make room for the message
var yOffset = 0; //offset for graph, if we need to move it
if (status && suggested) {
    var notLoopingReason = suggested.reason;
    display.oled.setCursor(0,16);
    if (status.suspended == true) {
        display.oled.writeString(font, 1, "PUMP SUSPENDED", 1, false, 0, false);
        yOffset = 3;
    }
    else if (status.bolusing == true) {
        display.oled.writeString(font, 1, "PUMP BOLUSING", 1, false, 0, false);
        yOffset = 3;
    }
    else if (notLoopingReason.includes("CGM is calibrating")) {
        display.oled.writeString(font, 1, "CGM calib./???/noisy", 1, false, 0, false);
        yOffset = 3;
    }
    else if (notLoopingReason.includes("CGM data is unchanged")) {
        display.oled.writeString(font, 1, "CGM data unchanged", 1, false, 0, false);
        yOffset = 3;
    }
    else if (notLoopingReason.includes("BG data is too old")) {
        display.oled.writeString(font, 1, "BG data too old", 1, false, 0, false);
        yOffset = 3;
    }
    else if (suggested.carbsReq) {
        display.oled.writeString(font, 1, "Carbs Requiredd: "+suggested.carbsReq+'g', 1, false, 0, false);
        yOffset = 3;
    }
//add more on-screen warnings/messages, maybe some special ones for xdrip-js users?
}

//display current target(s)
if (profile) {
    var targetLow = Math.round( (21+yOffset) - ( ( profile.bg_targets.targets[0].low - 250 ) / 8 ) );
    var targetHigh = Math.round( (21+yOffset) - ( ( profile.bg_targets.targets[0].high - 250 ) / 8 ) );
    display.oled.drawLine(2, targetHigh, 5, targetHigh, 1, false);
    display.oled.drawLine(2, targetLow, 5, targetLow, 1, false);
}

if (bg) {
    //render BG graph
    var numBGs = ((suggested != undefined) && (suggested.predBGs != undefined)) ? (72) : (120); //fill the whole graph with BGs if there are no predictions    var date = new Date();
    var zerotime = date.getTime() - ((numBGs * 5) * 600);
    var zero_x = numBGs + 5;
    for (var i = 0; i < numBGs; i++) {
        if (bg[i] != null) {
            var x = zero_x + Math.round(((((bg[i].date - zerotime)/1000)/60)/5));
            var y = Math.round( (21+yOffset) - ( ( bg[i].glucose - 250 ) / 8 ) );
            //left and right boundaries
            if ( x < 5 ) x = 5;
            if ( x > 127 ) x = 127;
            //upper and lower boundaries
            if ( y < (21+yOffset) ) y = (21+yOffset);
            if ( y > (51+yOffset) ) y = (51+yOffset);
            display.oled.drawPixel([x, y, 1, false]);
            // if we have multiple data points within 3m, look further back to fill in the graph
            if ( bg[i-1] && bg[i-1].date - bg[i].date < 200000 ) {
                numBGs++;
            }
        }
    }

    //calculate timeago for BG
    var startDate = new Date(bg[0].date);
    var endDate = new Date();
    var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
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
    //display BG number and timeago, add plus sign if delta is positive
    display.oled.setCursor(0,57);
    if (delta >= 0) {
        display.oled.writeString(font, 1, "BG:"+convert_bg(bg[0].glucose, profile)+"+"+stripLeadingZero(convert_bg(delta, profile))+" "+minutes+"m", 1, false, 0, false);
    } else {
        display.oled.writeString(font, 1, "BG:"+convert_bg(bg[0].glucose, profile)+""+stripLeadingZero(convert_bg(delta, profile))+" "+minutes+"m", 1, false, 0, false);
    }
}

//render predictions on the graph, but only if we have them
if (bg && suggested && suggested.predBGs != undefined) {
    //render line between actual BG and predicted
    x = zero_x + 1;
    display.oled.drawLine(x, 51+yOffset, x, 21+yOffset, 1, false);
    //render predictions
    var predictions = [suggested.predBGs.IOB, suggested.predBGs.ZT, suggested.predBGs.UAM, suggested.predBGs.COB];
    for (i = 0; i <= 48; i++) {
        x++;
        for(var n = 0; n <=3 && (predictions[n] != undefined); n++) {
        y = Math.round( (21+yOffset) - ( (predictions[n][i] - 250 ) / 8) );
        //right boundary
        if ( x > 127 ) x = 127;
        //upper and lower boundaries
        if ( y < (21+yOffset) ) y = (21+yOffset);
        if ( y > (51+yOffset) ) y = (51+yOffset);
        display.oled.drawPixel([x, y, 1, false]);
        }
    }
}

//display current temp basal and how long ago it was set, on the first line of the screen
if (statusStats && temp) {
    startDate = new Date(statusStats.mtime);
    endDate = new Date();
    var minutesAgo = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
    //display current temp basal
    display.oled.setCursor(0,0);
    var tempRate = Math.round(temp.rate*10)/10;
    display.oled.writeString(font, 1, "TB: "+temp.duration+'m '+tempRate+'U/h '+'('+minutesAgo+'m ago)', 1, false, 0, false);
}

//display current COB and IOB, on the second line of the screen
if (iob && cob) {
    display.oled.setCursor(0,8);
    display.oled.writeString(font, 1, "COB: "+cob.mealCOB+"g  IOB: "+iob[0].iob+'U', 1, false, 0, false);
}

//display bg graph axes
display.oled.drawLine(5, 51+yOffset, 5, 21+yOffset, 1, false);
display.oled.drawLine(5, 51+yOffset, 127, 51+yOffset, 1, false);

//render clock
var clockDate = new Date();
var clockHour = clockDate.getHours();
clockHour = (clockHour < 10 ? "0" : "") + clockHour;
var clockMin  = clockDate.getMinutes();
clockMin = (clockMin < 10 ? "0" : "") + clockMin;
display.oled.setCursor(83, 57);
display.oled.writeString(font, 1, clockHour+":"+clockMin, 1, false, 0, false);

display.oled.dimDisplay(true); //dim the display
display.oled.update(); //write buffer to the screen

fs.readFile(openapsDir+"/preferences.json", function (err, data) {
  if (err) throw err;
  preferences = JSON.parse(data);
  if (preferences.wearOLEDevenly && preferences.wearOLEDevenly.includes("off")) {
    display.oled.invertDisplay(false);
  }
  else if (preferences.wearOLEDevenly && preferences.wearOLEDevenly.includes("nightandday") && (clockHour >= 20 || clockHour <= 8)) {
    display.oled.invertDisplay(false);
  }
  else if (preferences.wearOLEDevenly && preferences.wearOLEDevenly.includes("nightandday") && (clockHour <= 20 && clockHour >= 8)) {
    display.oled.invertDisplay(true);
  }
  else {
    display.oled.invertDisplay((endDate % 2 == 1));
  }
});

 //
}//End of status display function
 //
