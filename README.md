# SocketIO Proxy

This is a proxy for socket-io, meant to sit alongside a web application
and act as a proxy for all web socket requests.  This allows our web application
to largely treat web sockets open by a user like _push_ notifications.

## Usage

### Server

Setting up the server side is as simple as:

``` bash
$ npm install
$ npm start
```

Once you have the server running, you can send events to it.  By default, messages
sent go to all clients, so

``` bash
$ curl -XPOST http://push.lvh.me:9999/news -d"word"
```

would send the signal `news` to all registered clients with `word` as the body.

You can use headers to specify a single (or multiple, comma-separated) individual
identifiers to send to.  Messages will be sent to all registered sockets for the
specified identifiers:

``` bash
$ curl -XPOST http://push.lvh.me:9999/news -d"word" -H"X-Notify-Identity:something"
```

### Client

Once you have your server running, we need to connect to it.  The first thing to do
is add `socket.io-client` and then add an identity on page load.  This registers
your client with `socket.io-proxy`.  The identity should be something your server-side
knows:

``` javascript
var socket = io.connect('http://:localhost:8888');
socket.on('identify', function () {
	socket.emit('identity', identity);
});
```

Once you're connected - its as easy as binding to events and handling the data that
comes in:

``` javascript
socket.on('something', function (data) {
	$('#box').prepend($('<div>').text(data));
});
```

## Configuration

There are a bunch of configuration settings you can run through.  The defaults
are specified in `config.json` in a standard distribution.

* `encoding` - The encoding to use to receive request bodies
* `bind.host` - The host for the bind server
* `bind.port` - The port for the bind server
* `push.host` - The host for the push server
* `push.port` - The port for the push server
* `socket.io.*` - Socket.io configurations
* `logging.*` - An array of logging settings

The encoding to use for bodies sent to clients
