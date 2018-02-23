
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

//Parse enacted.json
var enactedjson = fs.readFileSync("/root/myopenaps/enact/enacted.json");
var enacted = JSON.parse(enactedjson);

//parse iob.json
var iobjson = fs.readFileSync("/root/myopenaps/monitor/iob.json");
var iob = JSON.parse(iobjson);

//parse meal.jon
var carbjson = fs.readFileSync("/root/myopenaps/monitor/meal.json");
var cob = JSON.parse(carbjson);

//Parse glucose.json
var glucosejson = fs.readFileSync("/root/myopenaps/monitor/glucose.json");
var bg = JSON.parse(glucosejson);

//Parse, process, and display battery gauge
display.oled.drawLine(115, 57, 127, 57, 1); //top
display.oled.drawLine(115, 63, 127, 63, 1); //bottom
display.oled.drawLine(115, 57, 115, 63, 1); //left
display.oled.drawLine(127, 57, 127, 63, 1); //right
display.oled.drawLine(114, 59, 114, 61, 1); //iconify
var batteryjson = fs.readFileSync("/root/myopenaps/monitor/edison-battery.json");
var batterylevel = JSON.parse(batteryjson);
var batt = Math.round(127 - (batterylevel.battery / 10));
display.oled.fillRect(batt, 58, 126, 62, 1); //fill battery gauge

//Create and render clock
function displayClock() {
  var date=new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  display.oled.setCursor(70, 57);
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
var x = 5;
var i = 36;
var y = ( 21 - ( ( bg[i].glucose - 250 ) / 8 ) );
for (i = 36; i >= 0; i--) {
    x = x + 2;
    y = Math.round( 21 - ( ( bg[i].glucose - 250 ) / 8 ) );
    if ( y < 21 ) y = 21;
    if ( y > 51 ) y = 51;
    display.oled.drawPixel([x, y, 1]);
}

//render line between actual BG and predicted
x = x + 1;
display.oled.drawLine(x, 51, x, 21, 1);

//display predictions
var predictions = [enacted.predBGs.IOB, enacted.predBGs.ZT, enacted.predBGs.UAM, enacted.predBGs.COB];
var z = x - 2; //store position in case there are COB
x = x - 2;
for (i = 0; i <= 24; i++) {
    x = x + 2
    for(var n = 0; n <=3 && (predictions[n] != undefined); n++) {
    y = Math.round( 21 - ( (predictions[n][i] - 250 ) / 8) );
    if ( y < 21 ) y = 21;
    if ( y > 51 ) y = 51;
    display.oled.drawPixel([x, y, 1]);
    }
}

//calculate timeago for BG
var startDate = new Date(bg[0].date);
var endDate = new Date();
var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
var delta = Math.round(bg[0].delta);

//display BG number
display.oled.setCursor(0,57);
display.oled.writeString(font, 1, bg[0].glucose+"/"+delta+" "+minutes+"m", 1, true);

//calculate timeago for status
var startDate = new Date(iob[0].lastTemp.started_at);
var endDate = new Date();
var minutes = Math.round(( (endDate.getTime() - startDate.getTime()) / 1000) / 60);
//render enacted status
display.oled.setCursor(0,0);
display.oled.writeString(font, 1, enacted.duration+'m @ '+iob[0].lastTemp.rate+'U/h '+'('+minutes+'m)', 1, true);

//parse and render COB/IOB
display.oled.setCursor(0,8);
display.oled.writeString(font, 1, cob.mealCOB+"g --- "+iob[0].iob+'U', 1, true);
//render looping icon
//fs.stat("/tmp/pump_loop_completed", function(err, stats){
// var completed = ((new Date().getTime() - stats.mtime) / 1000) / 60;
// if ( completed < 10 ) {
//  display.oled.drawCircle(30, 10, 5, 1); //drawCircle does not work in this branch
// }
//
//});

//if pump is suspended, display that in the center of the screen

//var statusjson = fs.readFileSync("/root/myopenaps/monitor/status.json");
//var status = JSON.parse(statusjson);
//if ( status.suspended === "true" ) {
// display.oled.setCursor(44,28);
// display.oled.writeString(font, 1, "SUSPENDED", 1, true);
//}
//if ( status.bolusing === "true" ) {
// display.oled.setCursor(47,28);
// display.oled.writeString(font, 1, "BOLUSING", 1, true);
//}

