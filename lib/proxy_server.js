var fs = require('fs');
var url = require('url');
var http = require('http');
var winston = require('winston');
var io = require('socket.io');

// A server for handling requests to send to an open (or not open)
// socket.
var ProxyServer = function (config) {
  this.config = config;
  this.configureWinston();
  this.connections = {};
};

ProxyServer.prototype = {

  // Set up logging
  configureWinston: function () {
    winston.remove(winston.transports.Console);
    var detail, type;
    for (var i = 0; i < this.config.logging.length; i++) {
      detail = this.config.logging[i];
      type = detail.type;
      delete detail.type;
      winston.add(winston.transports[type], detail);
    }
  },

  // Start the servers
  start: function () {
    this.setupSocketServer();
    this.setupServer();
  },

  // Handle receiving a new socket connection
  handleConnection: function (socket) {
    winston.debug('got socket connection');
    var that = this;
    socket.on('identity', function (identity) {
      winston.debug('identified socket connection', { identity: identity });
      that.connections[identity] = that.connections[identity] || [];
      that.connections[identity].push(socket);
    });
    socket.emit('identify');
  },

  // Handle a request
  handleRequest: function (request, response) {
    var parsed = url.parse(request.url, false);
    var pieces = parsed.pathname.split('/');
    // Figure out where to send output
    var out;
    if (pieces.length === 3) {
      if (pieces[1] === '*') {
        var ser = this.socketServer;
        out = function (s, d) { ser.sockets.emit(s, d); };
      }
      else {
        var connections = this.connections[pieces[1]];
        if (connections) {
          out = function (s, d) {
            for (var i = 0; i < connections.length; i++) {
              connections[i].emit(s, d);
            }
          };
        }
      }
    }
    // If we have somewhere to send it, go go go
    if (out) {
      var data = '';
      request.on('data', function (d) {
        data += d.toString('utf8');
      });
      request.on('end', function () {
        out(pieces[2], data);
        winston.debug('sent data to ' + pieces[1] + '/' + pieces[2]);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ sent: data.length }));
      });
    }
    else {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'no such path' }));
    }
  },

  // Set up the socket server
  setupSocketServer: function () {
    var host = this.config.socket_host || 'bind.lvh.me';
    var port = this.config.socket_port || 8888;
    this.socketServer = server = io.listen(port, host, function () {
      winston.debug('listening on ' + host + ':' + port);
    });
    server.set('log level', -1);
    server.set('origins', "*:*");
    server.sockets.on('connection', this.handleConnection.bind(this));
  },

  // Set up the server
  setupServer: function () {
    var host = this.config.host || 'push.lvh.me';
    var port = this.config.port || 9999;
    var server = http.createServer();
    server.on('request', this.handleRequest.bind(this));
    server.listen(port, host, function () {
      winston.debug('listening on ' + host + ':' + port);
    });
  }

};

module.exports = ProxyServer;
