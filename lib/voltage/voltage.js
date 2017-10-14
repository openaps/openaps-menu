// voltage.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';


const gpio = require('rpi-gpio');


module.exports = function(settings) {
  const REGISTER_CONVERSION = 0x00;
  const REGISTER_CONFIG = 0x01;
  const REGISTER_THRESHOLD_LO = 0x10;
  const REGISTER_THRESHOLD_HI = 0x11;

  var addr = Number(settings.addr);
  var config = Number(settings.config);


  gpio.setup(settings.enablePin, gpio.DIR_HIGH, function () {
    setTimeout(function () { setVoltReadState(true); }, 500);
  });

  // example, read single ended
  function convert() {
    return new Promise(function (resolve, reject) {
      try {
        setVoltReadState(true);
        settings.i2cBus.writeWordSync(addr, REGISTER_CONFIG, swapEndian(config | 0x8000));
      }
      catch (e) {
        reject(new Error(e.toString()));
        return;
      }
      // need a smart calculation for delay
      setTimeout(function () {
        readValue()
        .then(function (v) {
          setVoltReadState(false);
          resolve(v);
        }).
        catch(function (e) { reject(e); });
      }, 500);
    });
  }

  /*
  this doesn't seem to work, or endian is wrong
  // wait for ready
  var waitReady = function () {
    var r = swapEndian(i2c1.readWordSync(addr, 0x01));
  //  console.log(r.toString(16))
    if (r & 0x8000) {
      readValue();
    }
    else {
      console.log('wait')
      setTimeout(waitReady, 10);
    }
  }
  */

  function readValue() {
    return new Promise(function (resolve, reject) {
      var v;
      try {
        var r = swapEndian(settings.i2cBus.readWordSync(addr, REGISTER_CONVERSION));
        v = 5 * (0x8000 & r ? (0x7fff & r) - 0x8000 : r) / 0x8000;
        v = (Math.round(v * 100))/100;
      }
      catch (e) {
        reject(new Error(e.toString()));
        return;
      }
      resolve(v);
    });
  }


  function swapEndian(word) {
    return ((word & 0xFF) << 8) | ((word >> 8) & 0xFF);
  }


  function setVoltReadState(state) {
    gpio.write(settings.enablePin, state, function(err) {
        if (err) throw err;
    });
  }


  return convert;
};
