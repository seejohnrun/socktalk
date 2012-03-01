var fs = require('fs');

module.exports = {

  // Create the server according to the configuration
  get: function (config) {
    var ssl_config = config.ssl;
    if (ssl_config) {
      ssl_config.key = fs.readFileSync(ssl_config.key, 'utf8');
      ssl_config.cert = fs.readFileSync(ssl_config.cert, 'utf8');
      return require('https').createServer(ssl_config);
    }
    else {
      return require('http').createServer();
    }
  }

};
