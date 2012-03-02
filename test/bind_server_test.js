var libpath = process.env['SOCKTALK_COV'] ? '../lib-cov' : '../lib';
var BindServer = require(libpath + '/bind_server');
var helpers = require('./helpers');

describe('BindServer', function () {

  describe('with no settings given', function () {

    var server = new BindServer();

    it('should have a default port', function () {
      server.port.should.equal(BindServer.defaultPort);
    });

    it('should have a default host', function () {
      server.host.should.equal(BindServer.defaultHost);
    });

  });

  describe('with settings for host and port given', function () {

    var customHost = 'example.com';
    var customPort = 7500;
    var config = { bind: { host: customHost, port: customPort } };
    var server = new BindServer(config);

    it('should change port', function () {
      server.port.should.equal(customPort);
    });

    it('should change host', function () {
      server.host.should.equal(customHost);
    });

  });

});
