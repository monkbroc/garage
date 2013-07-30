var openReq = require('./openRequest').openReq;
var io;
var latest_data;

function socketSetup(sio)
{
	io = sio;
	io.sockets.on('connection', socketHandle);
}

function socketHandle(socket)
{
	console.log("Client connected");
	socket.on('disconnect', function() {
		console.log("Client disconnected");
	});

	socket.on('open', function() {
		console.log("Sending challenge");
		var challenge = openReq.newChallenge();
		var content = { "challenge" : challenge };
		socket.emit('challenge', content);
	});

	socket.on('answer', function(data) {
		console.log("Received answer");
		var success = false;
		if('challenge' in data && 'answer' in data) {
			success = openReq.testChallenge(data.challenge, data.answer);
		}
		var content = { "success" : success };
		socket.emit('openResult', content);
	});

	if(latest_data != null) {
		socket.emit('update', latest_data);
	}
}

function updateVariables(v) {
	latest_data = v;
	io.sockets.emit('update', v);
}

exports.setup = socketSetup;
exports.updateVariables = updateVariables;
