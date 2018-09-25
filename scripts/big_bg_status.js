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

module.exports = bigbgstatus;

//
//Start of status display function
//

function bigbgstatus(display, openapsDir) {

display.oled.clearDisplay(true); //clear the buffer

//Parse all the .json files we need
try {
    var profile = JSON.parse(fs.readFileSync(openapsDir+"/settings/profile.json"));
} catch (e) {
    // Note: profile.json is optional as it's only needed for mmol conversion for now. Print an error, but not return
    console.error("Status screen display error: could not parse profile.json: ", e);
}
try {
    var batterylevel = JSON.parse(fs.readFileSync(openapsDir+"/monitor/edison-battery.json"));
} catch (e) {
    console.error("Status screen display error: could not parse edison-battery.json: ", e);
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
    var stats = fs.statSync("/tmp/pump_loop_success");
} catch (e) {
    console.error("Status screen display error: could not find pump_loop_success");
}

if(batterylevel) {
    //Process and display battery gauge
    display.oled.drawLine(116, 57, 127, 57, 1, false); //top
    display.oled.drawLine(116, 63, 127, 63, 1, false); //bottom
    display.oled.drawLine(116, 57, 116, 63, 1, false); //left
    display.oled.drawLine(127, 57, 127, 63, 1, false); //right
    display.oled.drawLine(115, 59, 115, 61, 1, false); //iconify
    var batt = Math.round(batterylevel.battery / 10);
    display.oled.fillRect(127-batt, 58, batt, 5, 1, false); //fill battery gauge
}

//calculate timeago for BG
if(bg && profile) {
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

    //display BG number, add plus sign if delta is positive 
    display.oled.setCursor(0,0);
    if (delta >= 0) {
        display.oled.writeString(font, 3, ""+convert_bg(bg[0].glucose, profile), 1, false, 0, false);
        display.oled.writeString(font, 1, "+"+stripLeadingZero(convert_bg(delta, profile)), 1, false, 0, false);
        display.oled.writeString(font, 2, "  "+minutes+"m", 1, false, 0, false);
    } else {
        display.oled.writeString(font, 3, ""+convert_bg(bg[0].glucose, profile), 1, false, 0, false);
        display.oled.writeString(font, 1, ""+stripLeadingZero(convert_bg(delta, profile)), 1, false, 0, false);
        display.oled.writeString(font, 2, "  "+minutes+"m", 1, false, 0, false);
    }
}

//calculate timeago for last successful loop
if(stats) {
    var date = new Date(stats.mtime);
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    //display last loop time
    display.oled.setCursor(0,57);
    display.oled.writeString(font, 1, "Last loop at: "+hour+":"+min, 1, false, 0, false);
}

//parse and render COB/IOB
if(iob && cob) {
    display.oled.setCursor(0,23);
    display.oled.writeString(font, 1, "IOB:", 1, false, 0, false);
    display.oled.writeString(font, 2, " "+iob[0].iob+'U', 1, false, 0, false);
    display.oled.setCursor(0,39);
    display.oled.writeString(font, 1, "COB:", 1, false, 0, false);
    display.oled.writeString(font, 2, " "+cob.mealCOB+'g', 1, false, 0, false);
}

display.oled.dimDisplay(true); //dim the display
display.oled.update(); // write buffer to the screen
  
fs.readFile(openapsDir+"/preferences.json", function (err, data) {
  if (err) throw err;
  preferences = JSON.parse(data);
  if (preferences.wearOLEDevenly.includes("off")) {
    display.oled.invertDisplay(false);
  }
  else if (preferences.wearOLEDevenly.includes("nightandday") && (clockHour >= 20 || clockHour <= 8)) {
    display.oled.invertDisplay(false);
  }
  else if (preferences.wearOLEDevenly.includes("nightandday") && (clockHour <= 20 || clockHour >= 8)) {
    display.oled.invertDisplay(true);
  }
  else {
    display.oled.invertDisplay((endDate % 2 == 1));
  }
});

 //
}//End of status display function
 //


