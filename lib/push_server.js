var fs = require('fs');
var winston = require('winston');

// A server for handling requests to send to an open (or not open)
// socket.
var ProxyServer = function (config, connectionManager) {
  this.config = config;
  if (!this.config.push) {
    this.config.push = {};
  }
  this.connectionManager = connectionManager;
};

ProxyServer.prototype = {

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
      response.end(JSON.stringify({
        sent: data.length,
        count: identities.length
      }));
    });
  },

  // Create the server according to the configuration
  createServer: function () {
    var ssl_config = this.config.push.ssl;
    if (ssl_config) {
      ssl_config.key = fs.readFileSync(ssl_config.key, 'utf8');
      ssl_config.cert = fs.readFileSync(ssl_config.cert, 'utf8');
      return require('https').createServer(ssl_config);
    }
    else {
      return require('http').createServer();
    }
  },

  // Set up the server
  start: function () {
    var host = this.config.push.host || 'localhost';
    var port = this.config.push.port || 9999;
    var server = this.createServer();
    var that = this;
    server.on('request', this.handleRequest.bind(this));
    server.listen(port, host, function () {
      winston.debug('push listening on ' + host + ':' + port);
    });
  }

};

module.exports = ProxyServer;
