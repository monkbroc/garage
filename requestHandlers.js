var querystring = require('querystring');
var path = require('path'); 
var fs = require('fs');
var openReq = require('./openRequest').openReq;

var variables = {};

function forbidden(query, response)
{
	response.writeHead(403, {"Content-Type": "text/plain"});
	response.write("403 Forbidden");
	response.end();
}

function file(pathname, query, response)
{
	if(pathname == "" || pathname.lastIndexOf("/") == pathname.length - 1)
	{
		pathname += "/index.html";
	}

	var rootPath = path.normalize(process.cwd() + "/www");
	console.log("Root path: " + rootPath);
	var filePath = path.normalize(rootPath + pathname);
	console.log("Requested path: " + filePath);

	if(filePath.indexOf(rootPath) != 0)
	{
		response.writeHead(403, {"Content-Type": "text/plain"});
		response.write("403 Forbidden");
		response.end();
	}

	var extension = filePath.match("\.[^.]*$");

	fs.stat(filePath, function(err, stats) {
		if(err)
		{
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not found");
			response.end();
		}
		else
		{
			if(stats.isDirectory())
			{
				console.log("Requested directory, redirecting");
				response.writeHead(301, { "Location" : pathname + "/" , "Content-Type": "text/plain"});
				response.write("301 Moved Permanently");
				response.end();
			}
			else
			{
			
				fs.readFile(filePath, function(err, data) {
					if(err)
					{
						response.writeHead(404, {"Content-Type": "text/plain"});
						response.write("404 Not found");
						response.end();
					}
					else
					{
						if(extension == ".html") {
							data = replaceVariables(data);
						}
						console.log(typeof data);
						response.writeHead(200);
						response.write(data);
						response.end();
					}
				});
			}
		}
	});
}

function json(query, response)
{
	response.writeHead(200, {"Content-Type": "application/json"});
	response.write(JSON.stringify(variables));
	response.end();
}

function replaceVariables(str) {
	str = String(str);
	for(var k in variables) {
		console.log("Replacing " + k);
		str = str.replace("###" + k + "###", variables[k]);
	}
	return str;
}

function updateVariables(v) {
	variables = v;
}

function open(query, response) {
	if(query) {
		var success = false;

		console.log('Received answer to challenge. Query string: ' + query);
		var options = querystring.parse(query);
		console.log(JSON.stringify(options));
		if('challenge' in options && 'answer' in options) {
			var challenge = options.challenge * 1;
			var answer = options.answer;
			success = openReq.testChallenge(challenge, answer);
		}

		var content = { "success" : success };

		response.writeHead(200, {"Content-Type": "application/json"});
		response.write(JSON.stringify(content));
		response.end();
	} else {
		var challenge = openReq.newChallenge();

		var content = { "challenge" : challenge };

		response.writeHead(200, {"Content-Type": "application/json"});
		response.write(JSON.stringify(content));
		response.end();
	}
}

function history(query, response)
{
	var maxLines = 40;

	var rootPath = path.normalize(process.cwd());
	var filePath = path.normalize(rootPath + "/history.log");

	fs.stat(filePath, function(err, stats) {
		if(err)
		{
			// no file = empty file
			writeContents(response, "[]");
		}
		else
		{
			fs.readFile(filePath, function(err, data) {
				if(err)
				{
					// bad file = empty file
					writeContents(response, "[]");
				}
				else
				{
					var lines = data.toString().split("\n");

					var first = Math.max(0, lines.length - maxLines);

					// omit last line because it's empty
					writeContents(response, "[" + lines.slice(first, lines.length-1).join(",") + "]");
				}
			});
		}
	});
}

function writeContents(response, contents) {
	response.writeHead(200, {"Content-Type": "application/json"});
	response.write(contents);
	response.end();

}

exports.forbidden = forbidden;
exports.file = file;
exports.json = json;
exports.open = open;
exports.history = history;
exports.updateVariables = updateVariables;

