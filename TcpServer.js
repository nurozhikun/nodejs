var net = require('net');
var util = require('util');

var TcpServer = module.exports = function(port, ip) {
	this.sockets = {};
	this._totalConnects = 0;
	this._isListened = false;
	var self = this;

	this.tcpServer = net.createServer(function(socket){ self.onConnected(socket); });

	this.tcpServer.listen(port||10006, ip||'localhost', function(){ self.onListened(); });
}

TcpServer.prototype.onConnected = function(socket) {
	console.log('client: %s:%d connected: %d', socket.remoteAddress, socket.remotePort, socket.localPort);
	this.sockets[this._totalConnects] = {'socket': socket, 'userid': 0};
}

TcpServer.prototype.onListened = function() {
	//process.emit('tcpServer', util.format("server is listening on: %s:%d", this._tcpServer.address().address, this._tcpServer.address().port));
	console.log(util.format("server is listening on: %s:%d", this.tcpServer.address().address, this.tcpServer.address().port));
	this._isListened = true;
}

/*class Client for sockets*/
var Client = function(socket) {
	this.data = {};
	this.data['socket'] = socket;
	this.data['userid'] = 0;
	var self = this;
	socket.on('data', function(data){ self.onData(data); });
	socket.on('close', function(had_error){ self.onClose(had_error); });
}

Client.prototype.onData = function(data) {
	;
}

Client.prototype.onClose = function(had_error) {
	;
}



