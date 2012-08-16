var fs = require('fs');

module.exports = {

  // Create the server according to the configuration
  get: function (config) {
    var ssl_config = config.ssl;
    if (ssl_config) {
      // Let ssl be specified as a boolean if no options needed
      if (typeof(ssl_config) === 'boolean') {
        ssl_config = {};
      }
      // Load up the keys and return the server
      if (ssl_config.key) {
        ssl_config.key = fs.readFileSync(ssl_config.key, 'utf8');
      }
      if (ssl_config.cert) {
        ssl_config.cert = fs.readFileSync(ssl_config.cert, 'utf8');
      }
      return require('https').createServer(ssl_config);
    }
    else {
      return require('http').createServer();
    }
  }

};
