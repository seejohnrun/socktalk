var libpath = process.env['SOCKTALK_COV'] ? '../lib-cov' : '../lib';
var PushServer = require(libpath + '/push_server');
var helpers = require('./helpers');

describe('PushServer', function () {

  describe('with no settings given', function () {

    var server = new PushServer();

    it('should have a default port', function () {
      server.port.should.equal(PushServer.defaultPort);
    });

    it('should have a default host', function () {
      server.host.should.equal(PushServer.defaultHost);
    });

  });

  describe('with settings for host and port given', function () {

    var customHost = 'example.com';
    var customPort = 7500;
    var config = { push: { host: customHost, port: customPort } };
    var server = new PushServer(config);

    it('should change port', function () {
      server.port.should.equal(customPort);
    });

    it('should change host', function () {
      server.host.should.equal(customHost);
    });

  });

  describe('when hitting a get request', function () {

    var request = new helpers.FakeRequest('GET', '/hello');
    var response = new helpers.FakeResponse();
    var server = new PushServer();
    server.handleRequest(request, response);
    request.end('');

    it('should get back a 404', function () {
      response.code.should.equal(404);
    });

  });

  describe('when hitting a post request with no headers', function () {

    var bytes = 'hi';
    var signal = 'hello';

    var connectionManager = new helpers.FakeConnectionManager();
    var request = new helpers.FakeRequest('POST', '/' + signal);
    var response = new helpers.FakeResponse();
    var server = new PushServer({}, connectionManager);
    server.handleRequest(request, response);
    request.write(bytes);
    request.end();

    it('should get back a 200', function () {
      response.code.should.equal(200);
    });

    it('should return the number of bytes sent', function () {
      JSON.parse(response.data).sent.should.equal(bytes.length);
    });

    it('should notify all', function () {
      connectionManager.notifyAll.should.equal(true);
    });

    it('should notify with proper signal', function () {
      connectionManager.signal.should.equal(signal);
    });

    it('should notify with proper data', function () {
      connectionManager.data.should.equal(bytes);
    });

  });

  describe('when hitting a post request with notify header', function () {

    var bytes = 'hi';
    var identity = 'something';
    var signal = 'hello';

    var connectionManager = new helpers.FakeConnectionManager();
    var request = new helpers.FakeRequest('POST', '/' + signal, {
      'x-notify-identity': identity
    });
    var response = new helpers.FakeResponse();
    var server = new PushServer({}, connectionManager);
    server.handleRequest(request, response);
    request.write(bytes);
    request.end();

    it('should get back a 200', function () {
      response.code.should.equal(200);
    });

    it('should return the number of bytes sent', function () {
      JSON.parse(response.data).sent.should.equal(bytes.length);
    });

    it('should notify one', function () {
      connectionManager.notify.should.equal(true);
    });

    it('should notify the proper identity', function () {
      connectionManager.identity.should.equal(identity);
    });

    it('should notify with proper signal', function () {
      connectionManager.signal.should.equal('hello');
    });

    it('should notify with proper data', function () {
      connectionManager.data.should.equal(bytes);
    });

  });

  describe('(integration) when starting a real server', function () {

    var host = 'localhost';
    var port = 8888;
    var pushServer = new PushServer({
      push: {
        host: host,
        port: port,
        ssl: false
      }
    });

    before(function (done) {
      pushServer.start(function () {
        done();
      });
    });

    describe('when taking a request', function (done) {
      var request = require('http').request({
        host: host,
        port: port,
        method: 'get',
        path: '/'
      });
      request.on('response', function (res) {
        res.statusCode.should.equal(404);
        done();
      });
    });

    after(function () {
      pushServer.stop();
    });

  });

});
