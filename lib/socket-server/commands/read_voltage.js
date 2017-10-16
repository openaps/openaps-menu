// read_voltage.js

/*jshint esversion: 6*/

module.exports = function (config) {
  return new Promise((resolve, reject) => {
    if (!config.voltage) {
      reject('No voltage module in config.')
    }
    else if (!config.battery || !config.battery.curve) {
      reject('Missing battery configuration.')
    }
    else {
      config.voltage()
      .then(function (v) {
        resolve({ batteryVoltage: v * 1000, battery: batteryPercent(v, config.battery) })
      })
      .catch(function (e) { reject(e) });
    }
  })

  function batteryPercent(v, battery) {
    var linearPoints = [{ voltage: battery.maxVoltage, percent: 100 }, { voltage: 0, percent: 0 }]
    var curveIndex = 0
    do {
      if (v < battery.curve[curveIndex]) {
        linearPoints[0] = battery.curve[curveIndex]
      }
      else {
        linearPoints[1] = battery.curve[curveIndex]
        break
      }
      curveIndex += 1
    } while(curveIndex < battery.curve.length)
    var pctRange = linearPoints[0].percent - linearPoints[1].percent
    var vltRange = linearPoints[0].voltage - linearPoints[1].voltage
    var pctPerVolt = pctRange / vltRange
    var pct = linearPoints[1].percent + (v - linearPoints[1].voltage) * pctPerVolt
    return Math.round(pct * 100)
  }
}
