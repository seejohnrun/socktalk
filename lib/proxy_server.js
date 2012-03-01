var fs = require('fs');
var url = require('url');
var http = require('http');
var winston = require('winston');
var io = require('socket.io');
var ConnectionManager = require('./connection_manager');

// A server for handling requests to send to an open (or not open)
// socket.
var ProxyServer = function (config) {
  this.config = config;
  this.setupSocketServer();
  this.connectionManager = new ConnectionManager(this.socketServer);
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
    this.setupServer();
  },

  // Handle receiving a new socket connection, and asking it
  // to identity
  handleConnection: function (socket) {
    var that = this;
    socket.on('identity', function (identity) {
      that.connectionManager.add(identity, socket);
    });
    socket.emit('identify');
  },

  // Handle a request
  handleRequest: function (request, response) {
    // Load the data when we can
    var that = this;
    var data = '';
    request.on('data', function (d) {
      data += d.toString('utf8');
    });
    // Once we have the whole data, notify the proper clients
    request.on('end', function () {
      var parsed = url.parse(request.url, false);
      var pieces = parsed.pathname.split('/');
      if (pieces.length === 3) {
        that.connectionManager.notify(pieces[1], pieces[2], data);
        winston.debug('sent data to ' + pieces[1] + '/' + pieces[2]);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ sent: data.length }));
      }
      else {
        response.writeHead(404, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ message: 'no such path' }));
      }
    });
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
