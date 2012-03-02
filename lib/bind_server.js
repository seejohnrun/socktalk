var fs = require('fs');
var winston = require('winston');
var socket_io = require('socket.io');
var configurable_server = require('./configurable_server');

// A server for handling requests to send to an open (or not open)
// socket.
var BindServer = function (config, connectionManager) {
  this.config = config || {};
  if (!this.config.bind) {
    this.config.bind = {};
  }
  this.connectionManager = connectionManager;
  this.host = this.config.bind.host || BindServer.defaultHost;
  this.port = this.config.bind.port || BindServer.defaultPort;
};

BindServer.defaultHost = 'localhost';
BindServer.defaultPort = 8888;

BindServer.prototype = {

  // Handle a request which may be for status, otherwise
  // some default response
  handleRequest: function (request, response) {
    if (request.url === '/_status') {
      fs.readFile('code', 'utf8', function (err, data) {
        var code = err ? 500 : parseInt(data, 10);
        response.writeHead(code, { 'content-type': 'text/plain' });
        response.end('ok');
      });
    }
    else {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('hello!');
    }
  },

  // Set up the socket server
  start: function () {
    // Create a server
    var server = configurable_server.get(this.config.bind);
    server.on('request', this.handleRequest.bind(this));
    // Bind IO to it and wait for connections
    var io = socket_io.listen(server);
    for (var name in this.config['socket.io']) {
      io.set(name, this.config['socket.io'][name]);
    }
    io.sockets.on('connection',
      this.connectionManager.add.bind(this.connectionManager)
    );
    this.connectionManager.socketServer = io;
    // Start it up
    var that = this;
    server.listen(this.port, this.host, function () {
      winston.debug('bind listening on ' + that.host + ':' + that.port);
    });
  }

};

module.exports = BindServer;
