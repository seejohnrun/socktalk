var winston = require('winston');

var ConnectionManager = function (socketServer) {
  this.socketServer = socketServer;
  this.connections = {};
};

ConnectionManager.prototype = {

  // Add a socket by requesting its identity and bucketing it
  add: function (socket) {
    var that = this;
    socket.on('identity', function (identity) {
      var connections = that.connections[identity];
      if (!connections) {
        connections = that.connections[identity] = [];
      }
      winston.debug('added a socket connection', { identity: identity });
      connections.push(socket);
    });
    socket.emit('identify');
  },

  // Notify a single identity of a message
  notify: function (identity, message, data) {
    if (identity === '*') {
      return this.notifyAll(message, data);
    }
    var connections = this.connections[identity];
    if (connections) {
      for (var i = 0; i < connections.length; i++) {
        winston.debug('sending data to ' + identity + '/' + message);
        connections[i].emit(message, data);
      }
    }
  },

  // Notify all
  notifyAll: function (message, data) {
    winston.debug('sending data to ' + '*/' + message);
    this.socketServer.sockets.emit(message, data);
  }

};

module.exports = ConnectionManager;
