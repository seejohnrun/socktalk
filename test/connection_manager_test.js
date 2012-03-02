var libpath = process.env['SOCKTALK_COV'] ? '../lib-cov' : '../lib';
var ConnectionManager = require(libpath + '/connection_manager');
var FakeSocket = require('./helpers').FakeSocket;

describe('ConnectionManager', function () {

  describe('when a socket auths and then disconnects', function () {

    var manager = new ConnectionManager();
    var ident = 'ident';

    before(function () {
      var client = new FakeSocket(ident);
      manager.add(client);
      client.disconnect();
    });

    it('should have no client for that identity', function () {
      manager.connections[ident].length.should.equal(0);
    });

  });

  describe('when a socket auths with an identity', function () {

    var manager = new ConnectionManager();
    var ident = 'ident';

    before(function () {
      var client = new FakeSocket(ident);
      manager.add(client);
    });

    it('should have a client for that identity', function () {
      manager.connections[ident].length.should.equal(1);
    });

  });

  describe('when a socket auths twice with the same identity', function () {

    var manager = new ConnectionManager();
    var ident = 'ident';

    before(function () {
      var client = new FakeSocket(ident);
      manager.add(client);
      client.identity(); // second time
    });

    it('should have a single client for that identity', function () {
      manager.connections[ident].length.should.equal(1);
    });

  });

  describe('when a socket auths reauths under a different name', function () {

    var manager = new ConnectionManager();
    var ident1 = 'ident1';
    var ident2 = 'ident2';

    before(function () {
      var client = new FakeSocket(ident1);
      manager.add(client);
      // second time under different name
      client.ident = ident2;
      client.identity();
    });

    it('should have no client for the original identity', function () {
      manager.connections[ident1].length.should.equal(0);
    });

    it('should have a single client for the new identity', function () {
      manager.connections[ident2].length.should.equal(1);
    });

  });

});
