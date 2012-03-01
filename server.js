var fs = require('fs');
var ProxyServer = require('./lib/proxy_server');

// Load the configuration
var config = JSON.parse(fs.readFileSync('./config.json'));

// Create a new server and start it
var server = new ProxyServer(config);
server.start();
