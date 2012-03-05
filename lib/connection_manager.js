var winston = require('winston');

var ConnectionManager = function () {
  this.connections = {};
};

ConnectionManager.prototype = {

  // Add a socket by requesting its identity and bucketing it
  add: function (socket) {
    var that = this;
    var currentIdentity;
    // Remove from any current identities and add to the new one
    socket.on('identity', function (ident) {
      if (currentIdentity) {
        that.removeSocketFromIdentity(currentIdentity, socket);
        currentIdentity = null;
      }
      that.addSocketToIdentity(ident, socket);
      currentIdentity = ident;
    });
    // Remove from any current identity
    socket.on('disconnect', function () {
      if (currentIdentity) {
        that.removeSocketFromIdentity(currentIdentity, socket);
        currentIdentity = null;
      }
    });
    // And ask to identify on each add
    socket.emit('identify');
  },

  // Remove a socket completely from an identity
  removeSocketFromIdentity: function (identity, socket) {
    var connections = this.connections[identity];
    if (connections) {
      for (var i = 0; i < connections.length; i++) {
        winston.debug('removed socket identity', {
          identity: identity,
          id: socket.id
        });
        connections.splice(i, 1);
      }
    }
  },

  // Add a socket to a given identity
  addSocketToIdentity: function (identity, socket) {
    var connections = this.connections[identity];
    if (!connections) {
      connections = this.connections[identity] = [];
    }
    winston.debug('added socket identity', {
      identity: identity,
      id: socket.id
    });
    connections.push(socket);
  },

  // Notify a single identity of a message
  notify: function (identity, message, data) {
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
               console.log('hi there!');
    winston.debug('sending data to ' + '*/' + message);
    this.socketServer.sockets.emit(message, data);
  }

};

module.exports = ConnectionManager;
