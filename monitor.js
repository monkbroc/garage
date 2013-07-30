var events = require("events");
var SerialPort = require('serialportpins').SerialPort;
var fs = require('fs');
var moment = require('moment');
var history = require('./history');


var Monitor = function() {
	// constructor
	var self = this;
	this.variables = { up: true, msg: "The door is open", since: "" };
	this.old_dsr = undefined;
	this.polarity = true;
	this.doOpen = false;

	this.portFilename = 'port.txt';
	this.sp = new SerialPort();

	this.sp.on('close', function (err) {
		console.log('Serial port closed');
	});

	this.sp.on('error', function (err) {
		console.log("Serial port error", err);
		setTimeout(function() { self.openPort(); }, 1000);
	});

	this.sp.on('open', function () {
		console.log('Serial port opened');
		console.log('setting DTR and RTS');

		//self.sp.setControlLines({dtr: true, rts: true});
		self.sp.setControlLines({rts: true});
		self.sp.setControlLines({dtr: true});
	});

}

Monitor.prototype = new events.EventEmitter;

Monitor.prototype.checkState = function() {
	if(this.sp.isOpen()) {
		// Perform open
		var rts = true;
		//console.log("doOpen: " + this.doOpen);
		if(this.doOpen) {
			rts = false;
			this.doOpen = false;
		}
		this.sp.setControlLines({rts: rts});

		lines = this.sp.getControlLines();

		if(lines && this.old_dsr != lines.dsr) {

			if(this.polarity ? lines.dsr : !lines.dsr) {
				this.variables.up = false;
				this.variables.msg = "The door is closed";
			} else {
				this.variables.up = true;
				this.variables.msg = "The door is open";
			}
			// don't update last open date on server start
			console.log("old_dsr="+this.old_dsr);
			if(this.old_dsr != undefined) {
				this.variables.since = this.now();
			}
			this.emit('update', this.variables);

			this.old_dsr = lines.dsr;
		}

		//process.stdout.write(this.variables.up ? 'o' : 'c');
	}

	var self = this;
	setTimeout(function() { self.checkState() }, 1000);
}

Monitor.prototype.start = function() {
	this.variables.since = history.lastOpen();
	this.emit('update', this.variables);

	this.openPort();
	this.checkState();
}

Monitor.prototype.openPort = function() {
	var self = this;
	fs.readFile(self.portFilename, function(err, data) {
		if(err) {
			console.log("Write the desired COM port name to " + self.portFilename);
			console.log(err);
		} else {
			var portName = data.toString().replace(/^\s+|\s+$/g,"");
			self.sp.open(portName);
		}
	});
}

Monitor.prototype.open = function() {
	console.log("Opening door");
	this.doOpen = true;
	this.sp.setControlLines({rts: false});
}

Monitor.prototype.now = function() {
	return moment().format("YYYY-MM-DD HH:mm:ss.000ZZ");
}


exports.Monitor = Monitor;
