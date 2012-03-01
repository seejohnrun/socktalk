var winston = require('winston');
var configurable_server = require('./configurable_server');

// A server for handling requests to send to an open (or not open)
// socket.
var PushServer = function (config, connectionManager) {
  this.config = config;
  if (!this.config.push) {
    this.config.push = {};
  }
  this.connectionManager = connectionManager;
};

PushServer.prototype = {

  // Handle a notify request
  handleNotifyRequest: function (request, response) {
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
      response.end(JSON.stringify({
        sent: data.length,
        count: identities.length
      }));
    });
  },

  // Handle a request
  handleRequest: function (request, response) {
    if (request.method === 'POST') {
      this.handleNotifyRequest(request, response);
    }
    else {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ message: 'no such path' }));
    }
  },

  // Set up the server
  start: function () {
    var host = this.config.push.host || 'localhost';
    var port = this.config.push.port || 9999;
    var server = configurable_server.get(this.config.push);
    var that = this;
    server.on('request', this.handleRequest.bind(this));
    server.listen(port, host, function () {
      winston.debug('push listening on ' + host + ':' + port);
    });
  }

};

module.exports = PushServer;
