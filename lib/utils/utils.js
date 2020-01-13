module.exports = {

  // displays a PNG image
  displayImage: function(pathToImage, display) {
    const pngparse = require('pngparse')
    pngparse.parseFile(pathToImage, function(err, image) {
      if(err)
        throw err
      display.clear();
      display.oled.drawBitmap(image.data);
    });
  },

  // Rounds value to 'digits' decimal places
  round: function(value, digits)
  {
    if (! digits) { digits = 0; }
    var scale = Math.pow(10, digits);
    return Math.round(value * scale) / scale;
  },

  // converts a mg/dl value to mmol/L (if set in profile)
  convertBg: function (value, profile)
  {
    if (profile != null && profile.out_units.toLowerCase() === "mmol/L")
    {
      return round(value / 18, 1).toFixed(1);
    }
    else
    {
      return Math.round(value);
    }
  },

  // remove leading zeros from a number
  stripLeadingZero: function (value)
  {
    var re = /^(-)?0+(?=[\.\d])/;
    return value.toString().replace( re, '$1');
  },

  // draws the reservoir icon with given fill value (0-300) 
  // looks similar to the icon on medtronic pumps
  drawReservoirIcon: function (display, x0, y0, fill){
    // Print Battery first
    var pixels = [
      [x0+4, y0, 1],
      [x0+5, y0, 1],
      [x0+6, y0, 1],
      [x0+7, y0, 1],
      [x0+8, y0, 1],
      [x0+9, y0, 1],
      [x0+10, y0, 1],
      [x0+11, y0, 1],
      [x0+12, y0, 1],
      [x0+13, y0, 1],
      [x0+14, y0, 1],
      //
      [x0+3, y0+1, 1],
      [x0+4, y0+1, 1],
      [x0+14, y0+1, 1],
      [x0+17, y0+1, 1],
      //
      [x0+2, y0+2, 1],
      [x0+3, y0+2, 1],
      [x0+14, y0+2, 1],
      [x0+17, y0+2, 1],
      //
      [x0+1, y0+3, 1],
      [x0+2, y0+3, 1],
      [x0+14, y0+3, 1],
      [x0+15, y0+3, 1],
      [x0+16, y0+3, 1],
      [x0+17, y0+3, 1],
      //
      [x0, y0+4, 1],
      [x0+1, y0+4, 1],
      [x0+14, y0+4, 1],
      [x0+15, y0+4, 1],
      [x0+16, y0+4, 1],
      [x0+17, y0+4, 1],
      //
      [x0+1, y0+5, 1],
      [x0+2, y0+5, 1],
      [x0+14, y0+5, 1],
      [x0+15, y0+5, 1],
      [x0+16, y0+5, 1],
      [x0+17, y0+5, 1],
      //
      [x0+2, y0+6, 1],
      [x0+3, y0+6, 1],
      [x0+14, y0+6, 1],
      [x0+17, y0+6, 1],
      //
      [x0+3, y0+7, 1],
      [x0+4, y0+7, 1],
      [x0+14, y0+7, 1],
      [x0+17, y0+7, 1],
      //
      [x0+4, y0+8, 1],
      [x0+5, y0+8, 1],
      [x0+6, y0+8, 1],
      [x0+7, y0+8, 1],
      [x0+8, y0+8, 1],
      [x0+9, y0+8, 1],
      [x0+10, y0+8, 1],
      [x0+11, y0+8, 1],
      [x0+12, y0+8, 1],
      [x0+13, y0+8, 1],
      [x0+14, y0+8, 1]
    ];  
    display.oled.drawPixel(pixels, false);
    
    // print fill level
    if (fill >= 25){
      display.oled.fillRect(x0+11, y0+2, 2, 5, 1, false);
    }
    if (fill >= 50){
      display.oled.fillRect(x0+8, y0+2, 2, 5, 1, false);  
    }
    if (fill >= 75){
      display.oled.fillRect(x0+5, y0+2, 2, 5, 1, false);    
    }
    
    if (fill < 4 && fill >= 0){
      display.oled.fillRect(x0+5, y0+4, 7, 1, 1, false);
    } else if (fill < 0){
      display.oled.drawLine(x0+5, y0+1, x0+14, y0+7, 1, false);
    }
  },

  // draws a battery icon with given fill value (0-100)
  // has three fill segments
  // looks similar to the battery icon on medtronic pumps
  drawBatteryIcon: function (display, x0, y0, fill){
    // Print Battery first
    var pixels = [
      [x0+2, y0, 1],
      [x0+3, y0, 1],
      [x0+4, y0, 1],
      [x0+5, y0, 1],
      [x0+6, y0, 1],
      [x0+7, y0, 1],
      [x0+8, y0, 1],
      [x0+9, y0, 1],
      [x0+10, y0, 1],
      [x0+11, y0, 1],
      [x0+12, y0, 1],
      [x0+13, y0, 1],
      //
      [x0+2, y0+1, 1],
      [x0+13, y0+1, 1],
      //
      [x0, y0+2, 1],
      [x0+1, y0+2, 1],
      [x0+2, y0+2, 1],
      [x0+13, y0+2, 1],
      //
      [x0, y0+3, 1],
      [x0+2, y0+3, 1],
      [x0+13, y0+3, 1],
      //
      [x0, y0+4, 1],
      [x0+2, y0+4, 1],
      [x0+13, y0+4, 1],
      //
      [x0, y0+5, 1],
      [x0+2, y0+5, 1],
      [x0+13, y0+5, 1],
      //
      [x0, y0+6, 1],
      [x0+1, y0+6, 1],
      [x0+2, y0+6, 1],
      [x0+13, y0+6, 1],
      //
      [x0+2, y0+7, 1],
      [x0+13, y0+7, 1],
      //
      [x0+2, y0+8, 1],
      [x0+3, y0+8, 1],
      [x0+4, y0+8, 1],
      [x0+5, y0+8, 1],
      [x0+6, y0+8, 1],
      [x0+7, y0+8, 1],
      [x0+8, y0+8, 1],
      [x0+9, y0+8, 1],
      [x0+10, y0+8, 1],
      [x0+11, y0+8, 1],
      [x0+12, y0+8, 1],
      [x0+13, y0+8, 1]
    ];  
    display.oled.drawPixel(pixels, false);
    
    // print fill level
    if (fill >= 25){
      display.oled.fillRect(x0+10, y0+2, 2, 5, 1, false);
    }
    if (fill >= 50){
      display.oled.fillRect(x0+7, y0+2, 2, 5, 1, false);  
    }
    if (fill >= 75){
      display.oled.fillRect(x0+4, y0+2, 2, 5, 1, false);
    }
    
    if (fill < 5 && fill >= 0){
      display.oled.fillRect(x0+5, y0+4, 6, 1, 1, false);
    } else if (fill < 0){
      display.oled.drawLine(x0+3, y0+1, x0+12, y0+7, 1, false);
    }
  },

  // draws a "mobile connection" icon
  drawConnectIcon: function (display, x0, y0, connected){
    x0 = x0+1;
    x1 = x0+11;
    y1 = y0+6;
    display.oled.drawLine(x0, y0, x0+4, y0, 1, false); //top
    display.oled.drawLine(x0, y0, x0+2, y0+3, 1, false); //left
    display.oled.drawLine(x0+4, y0, x0+2, y0+3, 1, false); //right
    display.oled.drawLine(x0+2, y0+3, x0+2, y0+6, 1, false); //bottom
    if (connected){
      display.oled.drawLine(x0+5, y0+3, x0+5, y0+6, 1, false); 
      display.oled.drawLine(x0+6, y0+3, x0+6, y0+6, 1, false);
      display.oled.drawLine(x0+8, y0, x0+8, y0+6, 1, false); 
      display.oled.drawLine(x0+9, y0, x0+9, y0+6, 1, false);
    }
  },

  // draws a wifi icon
  drawWiFiIcon: function (display, x0, y0){
    var pixels = [
      [x0+2, y0, 1],
      [x0+3, y0, 1],
      [x0+4, y0, 1],
      [x0+5, y0, 1],
      [x0+1, y0+1, 1],
      [x0+6, y0+1, 1],
      [x0, y0+2, 1],
      [x0+7, y0+2, 1],
      [x0+3, y0+3, 1],
      [x0+4, y0+3, 1],
      [x0+2, y0+4, 1],
      [x0+5, y0+4, 1],
      [x0+3, y0+6, 1],
      [x0+4, y0+6, 1],
      [x0+3, y0+7, 1],
      [x0+4, y0+7, 1]
    ];
    
    display.oled.drawPixel(pixels, false);
  },
  
  
  // draws a wifi icon with a bigger base (as access point mode)
  drawWiFiApIcon: function (display, x0, y0){
    var pixels = [
      [x0+2, y0, 1],
      [x0+3, y0, 1],
      [x0+4, y0, 1],
      [x0+5, y0, 1],
      [x0+1, y0+1, 1],
      [x0+6, y0+1, 1],
      [x0, y0+2, 1],
      [x0+7, y0+2, 1],
      [x0+3, y0+3, 1],
      [x0+4, y0+3, 1],
      [x0+2, y0+4, 1],
      [x0+5, y0+4, 1],
      [x0+3, y0+7, 1],
      [x0+4, y0+7, 1],
      
      [x0+1, y0+7, 1],
      [x0+2, y0+7, 1],
      [x0+3, y0+7, 1],
      [x0+4, y0+7, 1],
      [x0+5, y0+7, 1],
      [x0+6, y0+7, 1],
      
      [x0+1, y0+8, 1],
      [x0+2, y0+8, 1],
      [x0+3, y0+8, 1],
      [x0+4, y0+8, 1],
      [x0+5, y0+8, 1],
      [x0+6, y0+8, 1]      
    ];
    
    display.oled.drawPixel(pixels, false);
  },

  // draws a bluetooth icon
  drawBTIcon: function (display, x0, y0){
    var pixels = [
      [x0+2, y0, 1],
      [x0+3, y0, 1],
      [x0+2, y0+1, 1],
      [x0+4, y0+1, 1],
      [x0, y0+2, 1],
      [x0+2, y0+2, 1],
      [x0+5, y0+2, 1],
      [x0+1, y0+3, 1],
      [x0+2, y0+3, 1],
      [x0+4, y0+3, 1],
      [x0+2, y0+4, 1],
      [x0+3, y0+4, 1],
      [x0+1, y0+5, 1],
      [x0+2, y0+5, 1],
      [x0+4, y0+5, 1],
      [x0, y0+6, 1],
      [x0+2, y0+6, 1],
      [x0+5, y0+6, 1],
      [x0+2, y0+7, 1],
      [x0+4, y0+7, 1],
      [x0+2, y0+8, 1],
      [x0+3, y0+8, 1]
    ];
    
    display.oled.drawPixel(pixels, false);
  },

  // draws a arrow upwards (for rising BG)
  drawArrowUp: function (display, x0, y0){
    height = 16;
    
    var i;
    var max = 2;
    for (i = 0; i <= max; i++) {
      display.oled.drawLine(x0+max-i, y0+2*i, x0+max+1+i, y0+2*i, 1, false);
      display.oled.drawLine(x0+max-i, y0+2*i+1, x0+max+1+i, y0+2*i+1, 1, false);
    } 
    display.oled.drawLine(x0+max, y0+2*max, x0+max, y0+height, 1, false); //line
    display.oled.drawLine(x0+1+max, y0+2*max, x0+1+max, y0+height, 1, false); //line
  },

  // draws a arrow downwards (for falling BG)
  drawArrowDown: function (display, x0, y0){
    height = 16;
    y1 = y0+ height;
    var i;
    var max = 2;
    for (i = max; i >= 0; i--) {
      display.oled.drawLine(x0+max-i, y1-2*i, x0+max+1+i, y1-2*i, 1, false);
      display.oled.drawLine(x0+max-i, y1-2*i-1, x0+max+1+i, y1-2*i-1, 1, false);
    } 
    display.oled.drawLine(x0+max, y0, x0+max, y0+height, 1, false); //line
    display.oled.drawLine(x0+1+max, y0, x0+1+max, y0+height, 1, false); //line
  },
  
  // draws a round arrow icon (as loop icon)
  // shows an "!" when error=true
  // crosses the icon when disabled=true
  drawLoopIcon: function (display, x0, y0, error, disabled){
    var pixels = [
      [x0+8, y0, 1],
	  
      [x0+7, y0+1, 1],
      [x0+8, y0+1, 1],
	  
      [x0+6, y0+2, 1],
      [x0+7, y0+2, 1],
      [x0+8, y0+2, 1],
      [x0+9, y0+2, 1],
      [x0+10, y0+2, 1],
	  
      [x0+5, y0+3, 1],
      [x0+6, y0+3, 1],
      [x0+7, y0+3, 1],
      [x0+8, y0+3, 1],
      [x0+9, y0+3, 1],
      [x0+10, y0+3, 1],
      [x0+11, y0+3, 1],
	  
      [x0+3, y0+4, 1],
      [x0+6, y0+4, 1],
      [x0+7, y0+4, 1],
      [x0+8, y0+4, 1],
      [x0+9, y0+4, 1],
      [x0+10, y0+4, 1],
      [x0+11, y0+4, 1],
      [x0+12, y0+4, 1],
	  
      [x0+2, y0+5, 1],
      [x0+3, y0+5, 1],
      [x0+7, y0+5, 1],
      [x0+8, y0+5, 1],
      [x0+11, y0+5, 1],
      [x0+12, y0+5, 1],
      [x0+13, y0+5, 1],
	  
      [x0+1, y0+6, 1],
      [x0+2, y0+6, 1],
      [x0+3, y0+6, 1],
      [x0+8, y0+6, 1],
      [x0+12, y0+6, 1],
      [x0+13, y0+6, 1],
      [x0+14, y0+6, 1],
	  
      [x0, y0+7, 1],
      [x0+1, y0+7, 1],
      [x0+2, y0+7, 1],
      [x0+13, y0+7, 1],
      [x0+14, y0+7, 1],
      [x0+15, y0+7, 1],
	  
      [x0, y0+8, 1],
      [x0+1, y0+8, 1],
      [x0+14, y0+8, 1],
      [x0+15, y0+8, 1],
      [x0, y0+9, 1],
      [x0+1, y0+9, 1],
      [x0+14, y0+9, 1],
      [x0+15, y0+9, 1],
      [x0, y0+10, 1],
      [x0+1, y0+10, 1],
      [x0+14, y0+10, 1],
      [x0+15, y0+10, 1],
      [x0, y0+11, 1],
      [x0+1, y0+11, 1],
      [x0+14, y0+11, 1],
      [x0+15, y0+11, 1],
	  
      [x0, y0+12, 1],
      [x0+1, y0+12, 1],
      [x0+2, y0+12, 1],
      [x0+13, y0+12, 1],
      [x0+14, y0+12, 1],
      [x0+15, y0+12, 1],
	  
      [x0+1, y0+13, 1],
      [x0+2, y0+13, 1],
      [x0+3, y0+13, 1],
      [x0+7, y0+13, 1],
      [x0+12, y0+13, 1],
      [x0+13, y0+13, 1],
      [x0+14, y0+13, 1],
	  
      [x0+2, y0+14, 1],
      [x0+3, y0+14, 1],
      [x0+4, y0+14, 1],
      [x0+7, y0+14, 1],
      [x0+8, y0+14, 1],
      [x0+12, y0+14, 1],
      [x0+13, y0+14, 1],
	  
      [x0+3, y0+15, 1],
      [x0+4, y0+15, 1],
      [x0+5, y0+15, 1],
      [x0+6, y0+15, 1],
      [x0+7, y0+15, 1],
      [x0+8, y0+15, 1],
      [x0+9, y0+15, 1],
      [x0+12, y0+15, 1],
	  
      [x0+4, y0+16, 1],
      [x0+5, y0+16, 1],
      [x0+6, y0+16, 1],
      [x0+7, y0+16, 1],
      [x0+8, y0+16, 1],
      [x0+9, y0+16, 1],
      [x0+10, y0+16, 1],
	  
      [x0+5, y0+17, 1],
      [x0+6, y0+17, 1],
      [x0+7, y0+17, 1],
      [x0+8, y0+17, 1],
      [x0+9, y0+17, 1],
	  
      [x0+7, y0+18, 1],
      [x0+8, y0+18, 1],
      
      [x0+7, y0+19, 1]   
    ];
    
    display.oled.drawPixel(pixels, false);
	
  	if (error){
  		// exclamation mark
  		display.oled.fillRect(x0+21, y0, 4, 12, 1, false);
  		display.oled.fillRect(x0+21, y0+15, 4, 4, 1, false);
  	}
   
    if (disabled){
      // cross the icon out
      //TODO optimize drawing
      display.oled.drawLine(x0, y0+19, x0+15, y0, 1, false); //line
      display.oled.drawLine(x0, y0+18, x0+14, y0, 1, false); //line
      display.oled.drawLine(x0+1, y0+19, x0+15, y0+1, 1, false); //line
    }
  },
  
  // draws an arrow pointing on a big bar (as target icon)
  drawTargetIcon: function (display, x0, y0){
    var pixels = [
      [x0+3, y0, 1],
      [x0+3, y0+1, 1],      
      [x0+3, y0+2, 1],
      [x0+1, y0+3, 1],
      [x0+2, y0+3, 1],
      [x0+3, y0+3, 1],
      [x0+4, y0+3, 1],
      [x0+5, y0+3, 1],
      [x0+2, y0+4, 1],
      [x0+3, y0+4, 1],
      [x0+4, y0+4, 1],
      [x0+3, y0+5, 1],
	  
      [x0, y0+7, 1],
      [x0+1, y0+7, 1],
      [x0+2, y0+7, 1],
      [x0+3, y0+7, 1],
      [x0+4, y0+7, 1],
      [x0+5, y0+7, 1],
      [x0+6, y0+7, 1],
      [x0, y0+8, 1],
      [x0+1, y0+8, 1],
      [x0+2, y0+8, 1],
      [x0+3, y0+8, 1],
      [x0+4, y0+8, 1],
      [x0+5, y0+8, 1],
      [x0+6, y0+8, 1]  
    ];
    
    display.oled.drawPixel(pixels, false);
  },
  
  // draws a single 4x4 dot with x0y0 as center 
  drawDot: function(display, x0,y0){
    var pixels = [
      [x0, y0-4, 1],
      [x0, y0-3, 1],
      
      [x0, y0-2, 1],
      [x0-1, y0-1, 1],
      [x0, y0-1, 1],
      [x0+1, y0-1, 1],
      [x0-2, y0, 1],
      [x0-1, y0, 1],
      [x0, y0, 1],
      [x0+1, y0, 1],
      [x0+2, y0, 1],
      [x0-1, y0+1, 1],
      [x0, y0+1, 1],
      [x0+1, y0+1, 1],
      [x0, y0+2, 1],
      
      [x0, y0+3, 1],
      [x0, y0+4, 1]
    ];  
    display.oled.drawPixel(pixels, false);
  }
}