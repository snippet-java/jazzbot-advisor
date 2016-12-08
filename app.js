var express	= require('express');
var http	= require('http');
var app		= express();
var bodyParser		= require('body-parser');
var childProcess	= require('child_process');
var exec	= childProcess.exec;
var request	= require('request');

app.use("/",express.static("public"));
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended:true} )); 

var users = {};

app.all("/set", function(req, res) {
	const sessionId = getSessionId(req);
	var params = {};
	for (var i in req.body)		params[i] = req.body[i];
	for (var i in req.query)	params[i] = req.query[i];

	if (!(users[sessionId]))
		users[sessionId] = {params:{}};
	
	for (var i in params)
		users[sessionId].params[i] = params[i];
	
	res.send(true);
});


app.all("/mset", function(req, res) {
	const sessionId = getSessionId(req);
	const text = getValue(req, "text") || "";
	const values = text.split(/\s+/);
	
	if (values.length % 2 != 0) {
		res.send(false);
		return;		
	}

	if (!(users[sessionId]))
		users[sessionId] = {params:{}};
	
	for (var i = 0; i < values.length / 2; i++)
		users[sessionId].params[values[i*2]] = values[i*2+1];
	
	res.send(true);
});


app.all(["/unset","/remove"], function(req, res) {
	const sessionId = getSessionId(req);
	const key = getValue(req, "key") || "";

	if (users[sessionId] && users[sessionId].params && users[sessionId].params[key])
		delete(users[sessionId].params[key]);

	res.send(true);
});


app.all("/get", function(req, res) {
	const sessionId = getSessionId(req);
	const key = getValue(req, "key") || "";

	if (key.match(/password/i))
		res.send("Passwords are not retrievable");
	else if (users[sessionId] && users[sessionId].params && users[sessionId].params[key])
		res.send(users[sessionId].params[key]);
	else
		res.send("undefined");
});

app.all(["/start","/init"], function(req, res) {
	const sessionId = getSessionId(req);

	if (!(users[sessionId] && users[sessionId].params && users[sessionId].params.book)) {
		res.send("Please set the book first");
		return;
	}
	
	var user = users[sessionId];
	const bookUrl = users[sessionId].params.book;
	var options = {
			url : bookUrl,
			json : true
	}
	request(options, (err, response, body) => {
		if (err) {
			res.send(err);
			return;
		}
		
		user.book = body;
		user.context = {};
		for (var i in body) {
			var node = body[i];
			if (node && node.node == 1) {
				user.context.node = node;
				user.context.stack = [node];
				break;
			}
		}
		
		var options = [];
		for (var i in user.context.node) {
			if (i == "message" || i == "id" || i == "node") continue;
			options.push(i);
		}
	
		var msg = { message : user.context.node.message, options : options };
		if (user.context.node.description)
			msg.description = user.context.node.description;
		
		res.send(msg);
	})
});

app.all(["/reply","/answer","/goto","/navigate"], function(req, res) {
	const sessionId = getSessionId(req);
	const text = getValue(req, "text") || "";

	if (!(users[sessionId] && users[sessionId].params && users[sessionId].params.book)) {
		res.send("Please set the book first");
		return;
	}

	if (!(users[sessionId].book)) {
		res.send("Please start the conversation first");
		return;
	}
	
	var user = users[sessionId];
	var book = user.book;
	
	var nodeId = user.context.node.node;
	var nextNodeId = user.context.node.node;
	for (var i in user.context.node) {
		if (i == "message" || i == "id" || i == "node") continue;
		if (i.trim().toLowerCase() == text.trim().toLowerCase()) {
			nextNodeId = user.context.node[i];
			break;
		}
	}

	if (nextNodeId != nodeId) {
		for (var i in book) {
			var node = book[i];
			if (node && node.node == nextNodeId) {
				user.context.node = node;
				user.context.stack.push(node);
				break;
			}
		}
	}
	
	var options = [];
	for (var i in user.context.node) {
		if (i == "message" || i == "id" || i == "node" || i == "description") continue;
		options.push(i);
	}
	
	var msg = { message : user.context.node.message, options : options };
	if (user.context.node.description)
		msg.description = user.context.node.description;
	res.send(msg);
});


app.all(["/help"], function(req, res) {
	var help = [];
	help.push("help - Show this help");
	help.push("set <KEY> <VALUE> - Set parameters value");
	help.push("get <KEY> - Get parameters value");
	help.push("start - Start a conversation with the chef");
	help.push("reply - Reply answer to the chef");	
	res.send(help);
	
})

function getSessionId(req) {
	var sessionId = "";
	if (req.body)	sessionId = req.body.sessionId || "";
	if (req.query)	sessionId = req.query.sessionId || "";
	return sessionId;
}


function getPath(req) {
	var path = req;
	if (typeof req === "object") {
		if (req.url)	path = req.url;
		else			path = "";
	}
	return path.trim().replace(/^\//, "").replace(/[?#\s].*/, "");
}

function getValue(req, key) {
	var value; 
	if (req.body && req.body[key])		value = req.body[key];
	if (req.query && req.query[key])	value = req.query[key];
	return value;
}

function isVerbose(sessionId) {
	if (!(users && users[sessionId] && users[sessionId].params && users[sessionId].params.verbose)) {
		return false;
	}
	
	const verbose = users[sessionId].params.verbose;
	if (verbose === "true" || verbose === "1")
		return true;
	
	return false;
}

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});