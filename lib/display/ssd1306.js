
// SSD1306 OLED i2c display module driver

/*jshint esversion: 6*/

const extend = require('extend');
const oled = require('oled-i2c-bus');
//const i2c = require('i2c-bus');

module.exports = function(config) {
    var Display = {
      config: null,
      error: '',
      default: {
        font: require('oled-font-5x7'),
        address: 0x3C,
        height: 64,
        width: 128,
        lines: 5,
        characters: 21,
//        device: '/dev/i2c-1',
        title: ''
      },
      i2cBus: null,
      oled: null,

      init: function (config) {
        Display.config = extend(Display.default, config);
        Display.config.padding = Array(Display.config.characters).join(' ');
        if (!Display.config.title) {
          Display.config.title = Display.centerString('SSD1306') + '\n' + Display.centerString('Display Module');
        }

//        Display.i2cBus = i2c.openSync(1);
        Display.i2cBus = Display.config.i2cBus;
        Display.oled = new oled(Display.i2cBus, {
          width: Display.config.width,
          height: Display.config.height,
          address: Display.config.address,
          device: Display.config.device
        });

        Display.write(Display.config.title);
        Display.oled.update();
      },

      clear: function (str) {
        Display.oled.clearDisplay(true);
        Display.oled.setCursor(0, 0);
      },

      write: function (str) {
        Display.oled.writeString(Display.config.font, 1, str, 1, false, 4);// true, 4);

      },

      centerString: function (str) {
        if (str.length < Display.config.characters) {
          return Display.config.padding.slice(-1 * Math.round((Display.config.characters - str.length) / 2)) + str;
        }
        else {
          var s = Math.floor((str.length - Display.config.characters) / 2);
          return str.slice(s, s + Display.config.characters);
        }
      }
    };

    Display.init(config);
    return Display;
};
