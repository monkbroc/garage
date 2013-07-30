var gcm = require('node-gcm');
var fs = require('fs');

var apiKey = '999999999999999999999999999999999999999'; // Your GCM API key here
var numRetries = 4;

var registration_ids = [];
var ids_filename = "registration_ids.txt";

function setup() {
	loadIdsFromFile();
}

function loadIdsFromFile() {
	fs.readFile(ids_filename, function(err, data) {
		if(err) {
			console.log("Could not read ids from file " + ids_filename);
			console.log(err);
		} else {
			registration_ids = registration_ids.concat(JSON.parse(data));
		}
	});
}

function saveIdsToFile() {
	fs.writeFile(ids_filename, JSON.stringify(registration_ids), function(err, data) {
		if(err) {
			console.log("Could not save ids to file " + ids_filename);
			console.log(err);
		}
	});
}

function register(query, response) {
	if(query) {
		var m = query.match(/id=(.*)/);
		if(m) {
			doRegister(m[1]);
		}
	}
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write("200 OK");
	response.end();
}

function doRegister(id) {
	if(registration_ids.indexOf(id) == -1) {
		registration_ids.push(id);
		console.log("Registered id " + id);
		saveIdsToFile();
	}
}

function unregister(id) {
	var n = registration_id.indexOf(id);
	if(n != -1) {
		registration_id.splice(n, 1);
		saveIdsToFile();
	}
}

function update(variables) {
	console.log("Sending GCM message to " + registration_ids.length + " devices.");
	var message = new gcm.Message();
	message.collapseKey = 'door';

	for(var v in variables) {
		message.addData(v, variables[v]);
	}
	console.log("Message: " + JSON.stringify(message));

	var sender = new gcm.Sender(apiKey);
	for(var i in registration_ids) {
		var id = registration_ids[i];
		sender.send(message, [id], numRetries, function(result) {
			if (result === undefined) {
				console.log("Message could not be sent!");
			} else if(result.errorCode !== undefined) {
				if(result.errorCode == gcm.Constants.ERROR_NOT_REGISTERED ||
					result.errorCode == gcm.Constants.ERROR_INVALID_REGISTRATION) {
					/* registration ID is no longer valid -> unregister client */
					console.log("Goodbye " + id);
					unregister(id);
				} else {
					console.log("Unexpected error code " + result.errorCode);
				}
			} else {
				console.log("Sent with message ID: " + result.messageId);

				if(result.canonicalRegistrationId !== undefined) {
					console.log("Swapping registration id");
					unregister(id);
					doRegister(result.canonicalRegistrationId);
				}
			}
		});
	}
}

exports.setup = setup;
exports.register = register;
exports.update = update;
