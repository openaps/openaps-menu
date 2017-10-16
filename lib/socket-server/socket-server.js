// socket-server.js

/*jshint esversion: 6*/

/**
 * Listen for JSON messages on a Unix socket and emit command
 * message when a JSON message is a command.
 */

const net = require('net');
const fs = require('fs');
const events = require('events');
const extend = require('extend');
const defaults = {
  socketPath: './socket-server.sock'
}

module.exports = function (config) {
  config = extend(true, defaults, config)

  // create an event emitter to be used by the socketServer when commands are received
  var emitter = new events.EventEmitter()

  // create the socketServer with any custom config settings and our emitter
  var socketServer = {
    server: null,

    init: function (config) {
      socketServer.server = net.createServer(socketServer.onConnect)
      .on('error', socketServer.createError)
      .listen(config.socketPath)
    },

    closeServer: function () {
      if (fs.existsSync(config.socketPath)) {
        fs.unlinkSync(config.socketPath)
      }
      if (socketServer.server) {
        socketServer.server.close();
      }
    },

    createError: function (e) {
      switch (e.code) {
        case 'EADDRINUSE':
        // attempt to recover if abandoned unix socket
        var clientSocket = new net.Socket();
        clientSocket
        .on('error', function (e) {
          if (e.code == 'ECONNREFUSED') {
            fs.unlinkSync(config.socketPath);
            socketServer.server.listen(config.socketPath, function() {
              emitWarning('socket-server recovered.')
            });
          }
        })
        .connect({ path: config.socketPath }, function() {
          emitWarning('socket-server socket already in use.')
        });
        break;

        default:
        emitError('socket-server error. ' + e.toString())
      }
    },

    onConnect: function (client) {
      client
      .on('end', function () {})
      .on('data', socketServer.processclientData.bind(null, client));
    },

    processclientData: function (client, buffer) {
      var msg = buffer.toString();
      var cmd = null;
      try {
        cmd = JSON.parse(msg);
      }
      catch (e) {
        emitError('JSON parse error. ' + e.toString())
        socketServer.clientWrite(client, 401, 'JSON parse error. ' + e.toString())
        return;
      }

      if (!cmd || !cmd.command) {
        socketServer.clientWrite(client, 402, 'Missing command.');
        return;
      }

      try {
        switch (cmd.command) {
          case 'read_voltage':
          require('./commands/read_voltage')(config)
          .then((response) => {
            socketServer.clientWrite(client, 200, 'Success', response)
          })
          .catch((err) => {
            socketServer.clientWrite(client, 404, 'Error reading voltage. ' + err.toString())
          })
          break;

          default:
          socketServer.clientWrite(client, 403, 'Unknown command.');
        }
      }
      catch (e) {
        emitError('Error executing command. ' + e.toString() + ' ' + e.stack)
      }
    },

    clientWrite(client, statusCode, statusMessage, response) {
      try {
      client.write(JSON.stringify({
        status: {
          statusCode: statusCode,
          statusMessage: statusMessage
        },
        response: response || {}
      }))
      }
      catch(e) { emitError('Client write failed. ' + e.stack)}
      client.destroy()
    }
  }


  function emitError(errorString) {
    emitter.emit('error', { reason: errorString })
  }

  function emitWarning(warnString) {
    emitter.emit('warning', { reason: warnString })
  }

  // handle any exit events in the server process
  process
  .on('exit', exitHandler)
  .on('SIGINT', exitHandler)
  .on('uncaughtException', exitHandler);

  function exitHandler(err) {
    socketServer.closeServer();
    if (err) {
      emitError(err.toString())
    }
  }

  socketServer.init(config);
  return emitter;
};
