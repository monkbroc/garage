var fs = require('fs');
var util = require('util');

// Redirect console to file
var stdoutFile = "garage.log";
var stdoutFS = fs.createWriteStream(stdoutFile, {
	encoding: 'utf8',
	flags   : 'a+'
});

console.log = (function(log) {
	return function(string) {
		log.apply(console, arguments);
		stdoutFS.write(util.format.apply(util, arguments));
		stdoutFS.write('\n');
	}
})(console.log);


var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");
var socketHandler = require("./socketHandler");
var gcmHandler = require("./gcmHandler");
var openReq = require("./openRequest").openReq;
var history = require("./history");

var Monitor = require("./monitor").Monitor;

var handle = {}
handle["/"] = requestHandlers.forbidden;
handle["/garage/register"] = gcmHandler.register;
handle["/garage/state"] = requestHandlers.json;
handle["/garage/open"] = requestHandlers.open;
handle["/garage/history"] = requestHandlers.history;
/* Default handler */
handle[null] = requestHandlers.file;

var mon = new Monitor();
mon.on('update', requestHandlers.updateVariables);
mon.on('update', socketHandler.updateVariables);
mon.on('update', gcmHandler.update);
mon.on('update', history.log);
openReq.setOnOpen(function() { mon.open() });

gcmHandler.setup();
server.start(router.route, handle, socketHandler.setup);
mon.start();

