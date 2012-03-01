var winston = require('winston');

var ConnectionManager = function (socketServer) {
  this.socketServer = socketServer;
  this.connections = {};
};

ConnectionManager.prototype = {

  // Add a socket to a certain identity
  add: function (identity, socket) {
    var connections = this.connections[identity];
    if (!connections) {
      connections = this.connections[identity] = [];
    }
    winston.debug('added a socket connection', { identity: identity });
    connections.push(socket);
  },

  // Notify a single identity of a message
  notify: function (identity, message, data) {
    if (identity === '*') {
      return this.notifyAll(message, data);
    }
    var connections = this.connections[identity];
    if (connections) {
      for (var i = 0; i < connections.length; i++) {
        connections[i].emit(message, data);
      }
    }
  },

  // Notify all
  notifyAll: function (message, data) {
    this.socketServer.sockets.emit(message, data);
  }

};

module.exports = ConnectionManager;
