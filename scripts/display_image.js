
'use strict';

const i2c = require('i2c-bus');
const path = require('path');
const pngparse = require('pngparse');
const extend = require('extend');

if (process.argv.length < 3) {
  // image file not provided in arguments
  return;
}
var imageFile = process.argv[2];

var i2cBus = i2c.openSync(1);

// setup the display
var displayConfig = require('../config/display.json');
displayConfig.i2cBus = i2cBus;
var display = require('../lib/display/ssd1306')(displayConfig);

// display the image file
pngparse.parseFile(imageFile, function(err, image) {
  if(err)
    throw err
  display.oled.drawBitmap(image.data);
});

//dim the display
display.oled.dimDisplay(true);
