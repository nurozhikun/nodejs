var net = require('net');

var tcpClient = net.connect(10089, '192.168.1.104', function(){
	console.log('connected to server: %s', tcpClient.remoteAddress);
	tcpClient.end("&0INFORMBEGIN#0&1BINARY#1&21024#2&3randomstring#3&4hashcode#4&0INFORMEND#0", "utf-8");
});