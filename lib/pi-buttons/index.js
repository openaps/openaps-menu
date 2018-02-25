const net = require('net');
const events = require('events');
const emitter = new events.EventEmitter();
const pins = { [17]: 11, [27]: 13 };

var client = net.createConnection(__dirname + "/buttonevents");

client.on("connect", function() {

});

client.on("data", function(data) {
  let packets = data.toString().split(/\r?\n/);
  packets.forEach(packet => {
    var parts = /^([^{]+)\s({.*})/.exec(packet);
    if (parts) {
      try {
        var d = JSON.parse(parts[2]);
        emitter.emit(parts[1], pins[d.gpio], d);
      }
      catch (e) {}
    }
  });
});

module.exports = emitter;
