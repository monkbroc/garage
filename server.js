var http = require("http");
var url = require("url");
var io = require("socket.io");

function start(route, handle, setupSocket)
{
	function onRequest(request, response)
	{
		var parsed = url.parse(request.url);
		var pathname = parsed.pathname;
		var query = parsed.query;
		console.log("Request for " + pathname + " received.");

		if(pathname != undefined) {
			route(handle, pathname, query, response);
		}
	}

	var app = http.createServer(onRequest);
	
	io = io.listen(app);
	app.listen(8888);
	console.log("Server has started.");

	setupSocket(io);
}

exports.start = start;

