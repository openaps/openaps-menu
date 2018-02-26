
'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const extend = require('extend');
var os = require('os');
var fs = require('fs');
var font = require('oled-font-5x7');
var i2cBus = i2c.openSync(1);

// setup the display
var displayConfig = require('/root/src/openaps-menu/config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('/root/src/openaps-menu/lib/display/ssd1306')(displayConfig);

//Parse all the .json files we need
var enacted = JSON.parse(fs.readFileSync("/root/myopenaps/enact/enacted.json"));
var iob = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/iob.json"));
var cob = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/meal.json"));
var bg = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/glucose.json"));
var batterylevel = JSON.parse(fs.readFileSync("/root/myopenaps/monitor/edison-battery.json"));

//Process and display battery gauge
display.oled.drawLine(115, 57, 127, 57, 1); //top
display.oled.drawLine(115, 63, 127, 63, 1); //bottom
display.oled.drawLine(115, 57, 115, 63, 1); //left
display.oled.drawLine(127, 57, 127, 63, 1); //right
display.oled.drawLine(114, 59, 114, 61, 1); //iconify
var batt = Math.round(127 - (batterylevel.battery / 10));
display.oled.fillRect(batt, 58, 126, 62, 1); //fill battery gauge

//Create and render clock
function displayClock() {
  var date=new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  display.oled.setCursor(83, 57);
  display.oled.writeString(font, 1, hour+":"+min, 1, true);
}

displayClock();

//bg graph
display.oled.drawLine(5, 51, 5, 21, 1);
display.oled.drawLine(5, 51, 127, 51, 1);
//targets high and low
display.oled.drawLine(2, 30, 5, 30, 1);
display.oled.drawLine(2, 40, 5, 40, 1);

//render BG graph
var i = (enacted.predBGs != undefined) ? (36) : (60); //fill the whole graph with BGs if there are no predictions
var x = 5; //start in the right place
for (i; i >= 0; i--) {
    x = x + 2;
    var y = Math.round( 21 - ( ( bg[i].glucose - 250 ) / 8 ) );
    //upper and lower boundaries
    if ( y < 21 ) y = 21;
    if ( y > 51 ) y = 51;
    display.oled.drawPixel([x, y, 1]);
}

//render predictions, only if we have them
if (enacted.predBGs != undefined) {
  //render line between actual BG and predicted
  x = x + 1;
  display.oled.drawLine(x, 51, x, 21, 1);
  //render predictions
  var predictions = [enacted.predBGs.IOB, enacted.predBGs.ZT, enacted.predBGs.UAM, enacted.predBGs.COB];
  x = x - 2;
  for (i = 0; i <= 24; i++) {
      x = x + 2
      for(var n = 0; n <=3 && (predictions[n] != undefined); n++) {
      y = Math.round( 21 - ( (predictions[n][i] - 250 ) / 8) );
      //upper and lower boundaries
      if ( y < 21 ) y = 21;
      if ( y > 51 ) y = 51;
      display.oled.drawPixel([x, y, 1]);
      }
  }
}
//calculate timeago for BG
var startDate = new Date(bg[0].date);
var endDate = new Date();
var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
if (bg[0].delta) {
    var delta = Math.round(bg[0].delta);
} else {
    var delta = Math.round(bg[0].glucose - bg[1].glucose);
}

//display BG number, add plus sign if delta is positive
display.oled.setCursor(0,57);
if (delta >= 0) {
    display.oled.writeString(font, 1, "BG:"+bg[0].glucose+"(+"+delta+") "+minutes+"m", 1, true);
} else {
    display.oled.writeString(font, 1, "BG:"+bg[0].glucose+"("+delta+") "+minutes+"m", 1, true);
}

//calculate timeago for status
startDate = new Date(iob[0].lastTemp.started_at);
endDate = new Date();
minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);

//render enacted status
display.oled.setCursor(0,0);
display.oled.writeString(font, 1, "TB: "+enacted.duration+'m '+iob[0].lastTemp.rate+'U/h '+'('+minutes+'m)', 1, true);

//parse and render COB/IOB
display.oled.setCursor(0,8);
display.oled.writeString(font, 1, "COB: "+cob.mealCOB+"g  IOB: "+iob[0].iob+'U', 1, true);
