var fs = require('fs');

var historyFilename = "history.log";
var stream;

var lastOpenDate = "";

function init() {
	try {
		var data = fs.readFileSync(historyFilename);

		var array = data.toString().split("\n");

		// -2 because last line is empty
		var last = JSON.parse(array[array.length - 2]);
		lastOpenDate = last.since;
		console.log("Last opened: " + lastOpenDate);
	} catch(e) {
		console.log("Could not read " + historyFilename);
		console.log("Error: " + e.toString());
	}

	// done reading file, open write stream
	stream = fs.createWriteStream(historyFilename, {'flags': 'a', encoding: 'utf8'});
}

function log(data) {
	if(data.since != lastOpenDate) {
		if(stream) {
			stream.write(JSON.stringify(data) + "\n");
		}
	}
}

function lastOpen() {
	return lastOpenDate;
}

init();

exports.log = log;
exports.lastOpen = lastOpen;
