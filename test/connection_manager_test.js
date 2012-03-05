var libpath = process.env['SOCKTALK_COV'] ? '../lib-cov' : '../lib';
var ConnectionManager = require(libpath + '/connection_manager');
var helpers = require('./helpers');

describe('ConnectionManager', function () {

  describe('when a socket auths and then disconnects', function () {

    var manager = new ConnectionManager();
    var ident = 'ident';

    before(function () {
      var client = new helpers.FakeSocket(ident);
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
      var client = new helpers.FakeSocket(ident);
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
      var client = new helpers.FakeSocket(ident);
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
      var client = new helpers.FakeSocket(ident1);
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

  describe('when notifying all', function () {

    var message = 'hello';
    var data = 'hello world';

    var manager = new ConnectionManager();
    manager.socketServer = new helpers.FakeSocketServer();

    before(function () {
      manager.notifyAll(message, data);
    });

    it('should have called emit with the proper message', function () {
      manager.socketServer.sockets.called.message.should.equal(message);
    });

    it('should have called emit with the proper data', function () {
      manager.socketServer.sockets.called.data.should.equal(data);
    });

  });

  describe('when notifying a non-existent identity', function () {

    var manager = new ConnectionManager();
    manager.socketServer = new helpers.FakeSocketServer();

    before(function () {
      manager.notify('fakeident', 'hello', 'hello world');
    });

    it('should not emit to socketServer', function () {
      manager.socketServer.sockets.called.message.should.equal('newListener');
    });

  });

  describe('when notifying one of a single identity', function () {

    var ident = 'ident';
    var otherIdent = 'ident2';
    var message = 'hello';
    var data = 'hello world';

    var manager = new ConnectionManager();
    var socket = new helpers.FakeSocket(ident);
    var otherSocket = new helpers.FakeSocket(otherIdent);
    manager.socketServer = new helpers.FakeSocketServer();
    manager.add(socket);
    manager.add(otherSocket);

    before(function () {
      manager.notify(ident, message, data);
    });

    it('should not emit message on the socket server', function () {
      manager.socketServer.sockets.called.message.should.equal('newListener');
    });

    it('should not emit message to another ident', function () {
      otherSocket.called.message.should.equal('identity');
    });

    it('should emit the proper message to this ident', function () {
      socket.called.message.should.equal(message);
    });

    it('should emit the proper data to this ident', function () {
      socket.called.data.should.equal(data);
    });

  });

});
