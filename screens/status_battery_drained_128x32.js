// screens/status_text.js
// Status screen for drained battery
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

var fs = require('fs');
var font = require('oled-font-5x7');

var drawReservoirIcon = require('../lib/utils/utils.js').drawReservoirIcon;
var drawBatteryIcon = require('../lib/utils/utils.js').drawBatteryIcon;
var drawWiFiIcon = require('../lib/utils/utils.js').drawWiFiIcon;
var drawBTIcon = require('../lib/utils/utils.js').drawBTIcon;

// draws a battery icon with given fill value (0-100)
function drawBatteryDrainedIcon (display, x0, y0){
  //fillRect(xpos, ypos, size, size, color, false);
  //top
  display.oled.fillRect(x0+4, y0, 24, 3, 1, false);
  //bottom
  display.oled.fillRect(x0+4, y0+15, 24, 3, 1, false);
  //left
  display.oled.fillRect(x0+4, y0+3, 3, 12, 1, false);
  //right
  display.oled.fillRect(x0+25, y0+3, 3, 12, 1, false);
  
  // pole
  display.oled.fillRect(x0, y0+4, 4, 10, 1, false);
  display.oled.fillRect(x0+2, y0+6, 1, 6, 0, false);
  
  // exclamation mark
  display.oled.fillRect(x0+32, y0, 4, 12, 1, false);
  display.oled.fillRect(x0+32, y0+14, 4, 4, 1, false);
  
  // fill
  var pixels = [
      [x0+22, y0+8, 1],
      
      [x0+21, y0+9, 1],
      [x0+22, y0+9, 1],
      
      [x0+20, y0+10, 1],
      [x0+21, y0+10, 1],
      [x0+22, y0+10, 1],
      
      [x0+19, y0+11, 1],
      [x0+20, y0+11, 1],
      [x0+21, y0+11, 1],
      [x0+22, y0+11, 1],
      
      [x0+18, y0+12, 1],
      [x0+19, y0+12, 1],
      [x0+20, y0+12, 1],
      [x0+21, y0+12, 1],
      [x0+22, y0+12, 1]  
    ];    
    display.oled.drawPixel(pixels, false);

}

module.exports = function (display){
  display.clear();

  drawBatteryDrainedIcon(display, 5, 5);
  
  // show time when shutting down
  //var shutdownDate = new Date();
  // var hour = shutdownDate.getHours();
  // hour = (hour < 10 ? "0" : "") + hour;
  // var min  = shutdownDate.getMinutes();
  // min = (min < 10 ? "0" : "") + min;
  display.oled.setCursor(52,1);
  display.oled.writeString(font, 1, "The rig will", 1, false, 0, false);
  display.oled.setCursor(52,11);
  display.oled.writeString(font, 1, "shut down", 1, false, 0, false);
  display.oled.setCursor(52,21);
  display.oled.writeString(font, 1, "soon...", 1, false, 0, false);
  
  
  //dim the display
  display.oled.dimDisplay(true); 
  //write buffer to the screen
  display.oled.update(); 
}
