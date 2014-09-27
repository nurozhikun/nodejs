
var net = require('net');
var util = require('util');
//var TcpBinaryData = require('./TcpBinaryData.js');
var Protocol = require('./Protocol.js');

var TcpServer = module.exports = function(port, ip) {
	this._clientUsers = {};
	this._clientArray = new Array();
	this._totalConnects = 0;
	this._isListened = false;
	var self = this;

	this.tcpServer = net.createServer(function(socket){ self.onConnected(socket); });

	this.tcpServer.listen(port||10006, ip||'localhost', function(){ self.onListened(); });
}

TcpServer.prototype.onListened = function() {
	console.log(util.format("server is listening on: %s:%d", this.tcpServer.address().address, this.tcpServer.address().port));
	this._isListened = true;
}

TcpServer.prototype.onConnected = function(socket) {
	console.log('client: %s:%d connected: %d', socket.remoteAddress, socket.remotePort, socket.localPort);
	var i = 0, len = this._clientArray.length;
	while( i < len && this._clientArray[i] !== null ) {
		++i;
	}
	this._clientArray[i] = new Client(socket, i);
}

/**************************************
 *class Client for sockets
 ***************************************/
var Client = function(socket, index) {
	this._socket = socket || null;
	this._userid = 0;
	this._index  = index || -1;
	this._dataCoder	= new Protocol();
	this._backup = { 'buffer': null, 'datalength': 0 };
	//set callback functions of events;
	var self = this;
	socket.on('data', function(data){ self.onData(data); });
	socket.on('close', function(had_error){ self.onClose(had_error); });
}

Client.prototype.MAX_BACKUP_BUFFER_LEN = 8*1024;//bytes

Client.prototype.onData = function(data) {
	var nCount = 0;
	if( null === data ){
		return nCount;
	}
	console.log(data.toString());
	var dataCombined = this.combineData(data);
	var nBytesProcessed = this._dataCoder.decode( dataCombined.now );

	if( this._dataCoder.hasNewCommand() ) {//matched
		//console.log(this._dataCoder.findHeader, this._dataCoder.findEnd, this._dataCoder.codeFound, this._dataCoder.userIdFound);
	}
	if( !this._dataCoder.hasNewCommand() || 0 === nBytesProcessed /*|| nBytesProcessed === dataCombined.now.length*/ ) {//end processing
		if( 0 === nBytesProcessed ) {
			this.backupData(null, dataCombined.left);
		}
		else {
			this.backupData(dataCombined.now.slice(nBytesProcessed), dataCombined.left);
		}
	}
	else {// continue to the next processing
		var tempData = null;
		if( nBytesProcessed !== dataCombined.now.length ) {
			tempData = dataCombined.now.slice(nBytesProcessed);
		} 
		if( null !== dataCombined.left ){//the processing buffer must be backup.buffer
			this.backupData(tempData, null);
			tempData = dataCombined.left;
		}
		if( null !== tempData ){
			this.onData(tempData);
		}
	}
	return nCount;
}

Client.prototype.combineData = function(data) {
	var result = { 'left': null, 'now': data };
	if( 0 === this._backup.datalength ){//there is no backup data.
		return result;
	}
	else{
		var nLenLeft = this.MAX_BACKUP_BUFFER_LEN - this._backup.datalength;//cal the left size of the backup
		if( nLenLeft > data.length ) {//if left size if larger than the data size
			nLenLeft = data.length;//copy all data
		}
		else{//copy the left size of the data
			result.left = data.slice(nLenLeft);//slice the left data for keeping
		}
		data.copy(this._backup.buffer, this._backup.datalength, 0, nLenLeft);//copy data
		this._backup.datalength += nLenLeft;//cal the data length of the data
		result.now = this._backup.buffer.slice(0, this._backup.datalength)//make the (Buffer)now's length equal to the data length.
		return result;
	}
}

Client.prototype.backupData = function(inspectLeft, dataLeft) {
	var nSize = 0;
	if(null !== inspectLeft || null !== dataLeft) {
		if(null === this._backup.buffer ) {
			this._backup.buffer = new Buffer(this.MAX_BACKUP_BUFFER_LEN);
			this._backup.datalength = 0;
		}
		//
		var self = this;
		//
		var copyBuffer = function(dataParam) {
			var nIdleSize = self.MAX_BACKUP_BUFFER_LEN - self._backup.datalength;
			var nBytesCopied = 0;
			if( null !== dataParam ) {
				if( nIdleSize < dataParam.length ) {
					if( dataParam.length > self.MAX_BACKUP_BUFFER_LEN ) {
						dataParam.copy(self._backup.buffer, 0, dataParam.length - self.MAX_BACKUP_BUFFER_LEN);
						nBytesCopied =self.MAX_BACKUP_BUFFER_LEN;
					}
					else {
						nBytesCopied = self.MAX_BACKUP_BUFFER_LEN - dataParam.length;
						self._backup.buffer.copy(self._backup.buffer, 0, self._backup.datalength - nBytesCopied, self._backup.datalength);
						dataParam.copy(self._backup.buffer, nBytesCopied);
					}
					nBytesCopied = self._backup.datalength = self.MAX_BACKUP_BUFFER_LEN;
				}
				else {
					dataParam.copy(self._backup.buffer, self._backup.datalength);
					self._backup.datalength += dataParam.length;
					nBytesCopied = dataParam.length;
				}
			}
			return nBytesCopied;
		};
		nSize += copyBuffer(inspectLeft);
		nSize += copyBuffer(dataLeft);
	}
	return nSize;
}

Client.prototype.onClose = function(had_error) {
	;
}

Client.prototype.getIndex = function() {
	return this._index || -1;
}

Client.prototype.setUserId = function(id) {
	this._userid = id;
}

Client.prototype.getUserId = function() {
	return this._userid || null;
}

/**********************************************************
var InspectInform = function() {
this.findHeader	 = false;
this.codeFound	 = null;
this.userIdFound = 0;
this.findEnd     = false;
}

InspectInform.prototype.inspect = function(bufferData) {
var stringData = bufferData.toString();
var indexFind = 0;
var bytesProcessed = 0;
var strFound = null;
if( !this.findHeader ) {
indexFind = stringData.indexOf(this.G_CONNECTED_INFORM.header);
if( -1 != indexFind ) {
this.findHeader = true;
bytesProcessed += indexFind + this.G_CONNECTED_INFORM.header.length;
stringData = stringData.slice(indexFind + this.G_CONNECTED_INFORM.header.length);
}
else{
return bytesProcessed;
}
}
if( null === this.codeFound ) {
strFound = stringData.match(/(&1).*(#1)/);
if( null !== strFound ){
this.codeFound = strFound[0].slice(2, -2);
bytesProcessed += strFound.index + strFound[0].length;
stringData = stringData.slice(strFound.index + strFound[0].length);
}
}
if( 0 === this.userIdFound ) {
strFound = stringData.match(/(&2).*(#2)/);
if( null !== strFound ){
this.userIdFound = strFound[0].slice(2, -2);
bytesProcessed += strFound.index + strFound[0].length;
stringData = stringData.slice(strFound.index + strFound[0].length);
}
}
if( !this.findEnd ){
indexFind = stringData.indexOf(this.G_CONNECTED_INFORM.end);
if( -1 != indexFind ) {
this.findEnd = true;
bytesProcessed += indexFind + this.G_CONNECTED_INFORM.end.length;
//			stringData = stringData.slice(indexFind + this.G_CONNECTED_INFORM.end.length);
}
}
return bytesProcessed;
}

InspectInform.prototype.G_CONNECTED_INFORM = {
'header':'&0INFORMBEGIN#0',
'end':'&0INFORMEND#0', 
'maxlen':1024
};

***********************************************************/
