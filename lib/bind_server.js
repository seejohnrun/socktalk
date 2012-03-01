var fs = require('fs');
var winston = require('winston');
var socket_io = require('socket.io');

// A server for handling requests to send to an open (or not open)
// socket.
var ProxyServer = function (config, connectionManager) {
  this.config = config;
  if (!this.config.bind) {
    this.config.bind = {};
  }
  this.connectionManager = connectionManager;
};

ProxyServer.prototype = {

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

  // Create the server according to the configuration
  createServer: function () {
    var ssl_config = this.config.bind.ssl;
    if (ssl_config) {
      ssl_config.key = fs.readFileSync(ssl_config.key, 'utf8');
      ssl_config.cert = fs.readFileSync(ssl_config.cert, 'utf8');
      return require('https').createServer(ssl_config);
    }
    else {
      return require('http').createServer();
    }
  },

  // Set up the socket server
  start: function () {
    // Create a server
    var server = this.createServer();
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
    var host = this.config.bind.host || 'localhost';
    var port = this.config.bind.port || 8888;
    server.listen(port, host, function () {
      winston.debug('bind listening on ' + host + ':' + port);
    });
  }

};

module.exports = ProxyServer;
