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
};

ProxyServer.prototype = {

  // Start the servers
  start: function () {
    this.setupServer();
  },

  // Handle a request
  handleRequest: function (request, response) {
    // Grab the identifiers from the request headers
    var identities = (request.headers['x-notify-identity'] || '*').split(',');
    var message = request.url.substring(1); // remove leading slash
    // Load the data when we can
    var that = this;
    var data = '';
    request.on('data', function (d) {
      data += d.toString(that.config.encoding || 'utf8');
    });
    // Once we have the whole data, notify the proper clients
    request.on('end', function () {
      for (var i = 0; i < identities.length; i++) {
        that.connectionManager.notify(identities[i], message, data);
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ sent: data.length, count: identities.length }));
    });
  },

  // Set up the socket server
  setupSocketServer: function () {
    var host = this.config.socket_host || 'bind.lvh.me';
    var port = this.config.socket_port || 8888;
    this.socketServer = server = io.listen(port, host, function () {
      winston.debug('listening on ' + host + ':' + port);
    });
    this.connectionManager = new ConnectionManager(this.socketServer);
    for (var name in this.config['socket.io']) {
      server.set(name, this.config['socket.io'][name]);
    }
    server.sockets.on(
      'connection',
      this.connectionManager.add.bind(this.connectionManager)
    );
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
