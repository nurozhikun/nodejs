//var readline = require('readline');


// var rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout,
// //	completer: fcompleter
// });

// rl.setPrompt('$: ');
// rl.prompt();
// rl.on('line', function(cmd){
// 	console.log('You just typed: ' + cmd);
// 	rl.prompt();
// });

// process.on('tcpServer', function(stream){
// 	console.log(stream);
// });
// 	rl.prompt();

var TcpServer = require('./TcpServer.js');
var server = new TcpServer(10089,'192.168.1.104');


