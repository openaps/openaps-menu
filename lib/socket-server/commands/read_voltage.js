// read_voltage.js

/*jshint esversion: 6*/

module.exports = function (config) {
  return new Promise((resolve, reject) => {
    if (!config.voltage) {
      reject('No voltage module in config.')
    }
    else {
      config.voltage()
      .then(function (v) {
        resolve({ batteryVoltage: v * 1000, battery: batteryPercent(v) })
      })
      .catch(function (e) { reject(e) });
    }
  })

  function batteryPercent(v) {
    // TODO need to work out battery percentage curve
    return Math.round(v / 4.25 * 100)
  }
}
