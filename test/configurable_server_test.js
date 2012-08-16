var libpath = process.env['SOCKTALK_COV'] ? '../lib-cov' : '../lib';
var configurable_server = require(libpath + '/configurable_server');
var assert = require('assert');

describe('ConfigurableServer', function () {

  describe('with defaults', function () {

    var config = { host: 'localhost', port: 8888 };

    it('should get back an http server', function () {
      var server = configurable_server.get(config);
      assert.equal(server.SNICallback, undefined);
    });

  });

  describe('with asking for ssl', function () {

    var config = { host: 'localhost', port: 8888, ssl: true };

    it('should get back an https server', function () {
      var server = configurable_server.get(config);
      assert.notEqual(server.SNICallback, undefined);
    });

  });

});
