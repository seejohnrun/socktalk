var events = require('events');
var winston = require('winston');

// Turn off logging in tests

try {
  winston.remove(winston.transports.Console);
} catch (e) { }

// A fake client to help in tests

var FakeSocket = function (ident) {
  this.id = Math.floor(Math.random() * 100000);
  this.ident = ident;
  this.on('identify', this.identity.bind(this));
};

FakeSocket.prototype = new events.EventEmitter;

FakeSocket.prototype.identity = function () {
  this.emit('identity', this.ident);
};

FakeSocket.prototype.disconnect = function () {
  this.emit('disconnect');
};

module.exports = {
  FakeSocket: FakeSocket
};
