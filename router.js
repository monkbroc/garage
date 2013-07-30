function route(handle, pathname, query, response)
{
	console.log("About to route a request for " + pathname);
	if (typeof handle[pathname] === 'function')
	{
		handle[pathname](query, response);
	}
	else
	{
		/* send to default handler */
		handle[null](pathname, query, response);
	}
}

exports.route = route;

