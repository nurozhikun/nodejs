/* Data Protocol: connected informed protocol use utf-8 string data, not include '\0';
 * "&0INFORMBEGIN#0&1BINARY#1&21024#2&3randomstring#3&4hashcode#4&0INFORMEND#0"
 */
/* Data Protocol: binary stream protocol.
 * HEAD[8bytes]:Values array:Description
 *   [2 bytes]:[0xFAFB]:it is a fixed value, mark the begin of a package;
 *   [1 bytes]:
 *   [1 bytes]:[0xD0, 0xD1]:'0xD0' express the data of body is primitive; '0xD1' express the data of body is zipped;
 *   [4 bytes]:[any unsigned number]: express the length of the body, don't include the 'HEAD' and 'END'
 * BODY[N bytes]:
 * END[4 bytes]:
 *   [2 bytes]: kept for checkout
 *   [2 bytes]:[0xFDFC]:it is a fixed value, marh the end of a package;
 *
 */
var Protocol = module.exports = function() {
	this._command      = this.COMMAND['cmd_none'];
	this._bNewCmd	   = false;
	this._nCmdCount    = 0;
	this._bHeader 	   = false;
	this._bEnd		   = false;
	this._protocolType = null;
	this._userId	   = 0;
	this._decodeFunc   = null;
}

Protocol.prototype.hasNewCommand = function() {
	return this._bNewCmd;
}

Protocol.prototype.COMMAND = { 
	'cmd_none': 0,
	'cmd_get_user_id': 1,
	'cmd_': 2 
};

Protocol.prototype.G_CONNECTED_INFORM = {
	'header':'&0INFORMBEGIN#0',
	'end':'&0INFORMEND#0', 
	'maxlen':1024
};

Protocol.prototype.decode = function(bufferData) {
	var nBytes = 0;
	var nCmdCount = this._nCmdCount;
	this._bNewCmd = false;
	if( null === this._decodeFunc /*this.COMMAND['cmd_none'] === this._command*/ ) {
		nBytes = this.inspectType(bufferData);
		if( nCmdCount !== this._nCmdCount ) {
			if( this._protocolType === 'BINARY') {
				this._decodeFunc = codeBinary;
			}
			else {
				this._decodeFunc = codeString;
			}
			this._bNewCmd = true;
		}
	}
	else{
		nBytes = this._decodeFunc(bufferData);
		if( nCmdCount !== this._nCmdCount ) {//new COMMAND
			;
			this._bNewCmd = true;
		}
	}
}

Protocol.prototype.inspectType = function(bufferData) {
	var stringData = bufferData.toString();
	var indexFind = 0;
	var bytesProcessed = 0;
	var strFound = null;
	if( !this._bHeader ) {
		indexFind = stringData.indexOf(this.G_CONNECTED_INFORM['header']);
		if( -1 !== indexFind ) {
			this._bHeader = true;
			bytesProcessed += indexFind + this.G_CONNECTED_INFORM['header'].length;
			stringData = stringData.slice(indexFind + this.G_CONNECTED_INFORM['header'].length);
		}
		else{
			return bytesProcessed;
		}
	}
	if( null === this._protocolType ) {
		strFound = stringData.match(/(&1).*(#1)/);
		if( null !== strFound ){
			this._protocolType = strFound[0].slice(2, -2);
			bytesProcessed += strFound.index + strFound[0].length;
			stringData = stringData.slice(strFound.index + strFound[0].length);
		}
	}
	if( 0 === this._userId ) {
		strFound = stringData.match(/(&2).*(#2)/);
		if( null !== strFound ){
			this._userId = strFound[0].slice(2, -2);
			bytesProcessed += strFound.index + strFound[0].length;
			stringData = stringData.slice(strFound.index + strFound[0].length);
		}
	}
	if( !this._bEnd ){
		indexFind = stringData.indexOf(this.G_CONNECTED_INFORM['end']);
		if( -1 !== indexFind ) {
			this._bEnd = true;
			bytesProcessed += indexFind + this.G_CONNECTED_INFORM['end'].length;
			this._command = this.COMMAND['cmd_get_user_id'];
			++this._nCmdCount;
//			stringData = stringData.slice(indexFind + this.G_CONNECTED_INFORM['end'].length);
		}
	}
	return bytesProcessed;
}

var codeBinary = function(bufferData) {
	var nBytes = 0;

	return nBytes;
}

var codeString = function(bufferData) {
	var nBytes = 0;

	return nBytes;
}