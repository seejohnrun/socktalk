var fs = require('fs');
var winston = require('winston');
var ProxyServer = require('./lib/proxy_server');

// Load the configuration
var config = JSON.parse(fs.readFileSync('./config.json'));

// Load the logging configuration
winston.remove(winston.transports.Console);
var detail, type;
for (var i = 0; i < config.logging.length; i++) {
  detail = config.logging[i];
  type = detail.type;
  delete detail.type;
  winston.add(winston.transports[type], detail);
}


// Create a new server and start it
var server = new ProxyServer(config);
server.start();
