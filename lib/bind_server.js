var url = require('url');
var http = require('http');
var winston = require('winston');
var io = require('socket.io');

// A server for handling requests to send to an open (or not open)
// socket.
var ProxyServer = function (config, connectionManager) {
  this.config = config;
  this.connectionManager = connectionManager;
};

ProxyServer.prototype = {

  // Set up the socket server
  start: function () {
    var host = this.config.socket_host || 'bind.lvh.me';
    var port = this.config.socket_port || 8888;
    var server = io.listen(port, host, function () {
      winston.debug('listening on ' + host + ':' + port);
    });
    this.connectionManager.socketServer = server;
    for (var name in this.config['socket.io']) {
      server.set(name, this.config['socket.io'][name]);
    }
    server.sockets.on('connection', this.connectionManager.add.bind(this.connectionManager));
  }

};

module.exports = ProxyServer;
