var assert = require('assert');
var configurable_server = require('../lib/configurable_server');

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
