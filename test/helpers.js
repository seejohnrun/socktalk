var events = require('events');
var winston = require('winston');

// Turn off logging in tests

try {
  winston.remove(winston.transports.Console);
} catch (e) { }

// A fake connection manager

var FakeConnectionManager = function (receiver) {
};

FakeConnectionManager.prototype = {

  notify: function (identity, signal, data) {
    this.identity = identity;
    this.signal = signal;
    this.data = data;
    this.notify = true;
  },

  notifyAll: function (signal, data) {
    this.signal = signal;
    this.data = data;
    this.notifyAll = true;
  }

};

// A fake request object

var FakeRequest = function (method, url, headers) {
  this.method = method;
  this.url = url;
  this.headers = headers || {};
};

FakeRequest.prototype = new events.EventEmitter;

FakeRequest.prototype.write = function (d) {
  this.emit('data', d);
};

FakeRequest.prototype.end = function (d) {
  this.emit('end', d);
};

// A fake response object

var FakeResponse = function () {
  this.data = '';
};

FakeResponse.prototype = {

  writeHead: function (code, headers) {
    this.code = code;
    this.headers = headers;
  },

  write: function (data) {
    this.data += data;
  },

  end: function (data) {
    this.write(data);
  }

};

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

// Export

module.exports = {
  FakeSocket: FakeSocket,
  FakeConnectionManager: FakeConnectionManager,
  FakeRequest: FakeRequest,
  FakeResponse: FakeResponse
};
