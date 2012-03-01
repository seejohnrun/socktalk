var fs = require('fs');
var winston = require('winston');
var ConnectionManager = require('./lib/connection_manager');
var PushServer = require('./lib/push_server');
var BindServer = require('./lib/bind_server');

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

// Create the servers and start them up
var connectionManager = new ConnectionManager();
new BindServer(config, connectionManager).start();
new PushServer(config, connectionManager).start();
