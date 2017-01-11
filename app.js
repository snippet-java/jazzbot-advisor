var express	= require('express');
var http	= require('http');
var app		= express();
var bodyParser		= require('body-parser');
var childProcess	= require('child_process');
var exec	= childProcess.exec;
var request	= require('request');
var soundex	= require('soundex');

app.use("/",express.static("public"));
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended:true} )); 

var users = {};
const numbers = ["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen"];

app.all("/set", function(req, res) {
	const sessionId = getSessionId(req);
	var params = {};

	if (!(users[sessionId]))
		users[sessionId] = {params:{},context:{},books:{}};
	
	var user = users[sessionId]; 
	
	if (req.query.book) {
		var match = req.query.book.match(/(\S+)\s+(\S+)/);
		if (!(match)) {
			res.send(false);
			return;
		}
		
		user.books[match[1]] = { url : match[2] };
		var message = "Which book would you like to use? Say one of the following:";
		var msg = {
				message : message,
				options : getBookOptions(user.books) 
		}
		res.send(msg);
		return;
	}
	
	for (var i in req.body)		params[i] = req.body[i];
	for (var i in req.query)	params[i] = req.query[i];
	
	for (var i in params)
		user.params[i] = params[i];
	
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
	const user = users[sessionId];
	
	if (key.match(/password/i))
		res.send("Passwords are not retrievable");
	else if (user && user.params && user.params[key])
		res.send(user.params[key]);
	else
		res.send("undefined");
});


app.all(["/start","/init"], function(req, res) {
	const sessionId = getSessionId(req);
	const text = getValue(req, "text") || "";
	
	var user = users[sessionId];
	if (!user) {
		var message = "No books available. Please set the books first.";
		res.send(message);
		return;
	}
	
	var context = user.context;
	if (!(context.bookId)) {
		var message = "First, please say which book would you like to use? Say one of the following:";
		var msg = {
				message : message,
				options : getBookOptions(user.books) 
		}
		res.send(msg);
		return;
	}
	
	var bookId = context.bookId;
	var book = user.books[bookId];
	var chapters = book.chapters;
	context.chapters = chapters;
	
	var match = text.match(/chapter\s+(\S+)/i);
	if (match) {
		context.allChapters = false;
		var chapterId = getChapterId(chapters, match[1]);
		
		if (chapterId == -1) {
			var msg = {
				message : "Invalid option.",
				options : getChapterOptions(chapters)
			}
			res.send(msg);
			return;
		}
		
		startChapter(context, chapterId, false, (message) => {
			res.send(message);
		});
		return;
	}
	
	match = text.match(/all\s+chapters(\s+in\s+(\S+)|$)/i);
	if (match) {
		context.allChapters = true;
			
		var chapterId;
		if (match[2] && (match[2].toLowerCase() == "random" || soundex(match[2]) == soundex("random"))) {
			context.allChaptersRandom = true;
			chapterId = getNextRandomChapterId(chapters, []);
		} else {
			context.allChaptersRandom = false;
			chapterId = getNextChapterId(chapters);
		}
		
		if (!(chapterId && chapterId != -1 && chapterId != -2)) {
			var message = "Error getting the chapterId. Please try again.";
			res.send(message);
			return;
		} 

		startChapter(context, chapterId, false, (message) => {
			res.send(message);
		});
		return;
	}
	
	match = text.match(/next\s+chapter/i);
	if (match && context.allChapters && !context.hasEnded) {
		var chapterId;
		
		if (context.allChaptersRandom)
			chapterId = getNextRandomChapterId(chapters, context.visitedChapters);
		else
			chapterId = getNextChapterId(chapters, context.chapterId);
		
		if (!(chapterId && chapterId != -1 && chapterId != -2)) {
			context.hasEnded = true;
			context.continue = false;
			var message = " All chapters in book " + context.bookId + " has ended.";
			message += " Do you want to restart?";	
			
			res.send(message);
			return;
		} 

		startChapter(context, chapterId, true, (message) => {
			res.send(message);
		});
		return;
	}
});

app.all(["/reply","/answer","/goto","/navigate","/number"], function(req, res) {
	const sessionId = getSessionId(req);
	var text = getValue(req, "text") || "";

	var user = users[sessionId];
	if (!user) {
		var message = "No books available. Please set the books first.";
		res.send(message);
		return;
	}
	
	if (text == "to")	text = "two";
	if (text == "for")	text = "four";
	
	var match = text.match(/number\s+(\S+)/i);
	if (match)
		text = match[1];

	var context = user.context;
	if (!(context.bookId)) {
		var message = "First, please say which book would you like to use? Say one of the following:";
		var msg = {
				message : message,
				options : getBookOptions(user.books) 
		}
		res.send(msg);
		return;
	}
	
	var bookId = context.bookId;
	var book = user.books[bookId];
	
	var chapters = book.chapters;

	if (!(context.nodes && context.nodeId)) {
		var msg = {
				message : "Please start the chapters first. Say one of the following:",
				options : getChapterOptions(chapters)
		}
		res.send(msg);
		return;
	}
	
	if (context.hasEnded) {
		var text_ = text.trim().toLowerCase();
		if (text_ == "one" || text_ == "1" || text_ == "yes" || soundex(text_) == soundex("yes")) {
			var next = false;
			var chapterId = context.chapterId;
			if (context.allChapters) {
				if (context.continue) {
					next = true;
					if (context.allChaptersRandom)	chapterId = getNextRandomChapterId(chapters, context.visitedChapters);
					else							chapterId = getNextChapterId(chapters, chapterId);					
				} else {
					if (context.allChaptersRandom)	chapterId = getNextRandomChapterId(chapters, []);
					else							chapterId = getNextChapterId(chapters);					
				}
				
				if (!(chapterId && chapterId != -1 && chapterId != -2)) {
					var message = "Error getting the chapterId. Please try again.";
					res.send(message);
					return;
				}
			}

			startChapter(context, chapterId, next, (message) => {
				res.send(message);
			});
		} else if (text_ == "two" || text_ == "to" || text_ == "2" || text_ == "no" || soundex(text_) == soundex("no")) {
			var message;
			if (context.allChapters && !context.continue)
				message = "Thank you for completing all the chapters in book " + context.bookId + ". Good bye!";
			else
				message = "Thank you for completing chapter " + numbers.indexOf(context.chapterId) + ". Good bye!";
			res.send(message);
			context = {};
		} else {
			var msg = {
					message : "Invalid option. " + context.message,
					options : context.options
			}
			res.send(msg);
		}
		return;
	}

	var nodes = context.nodes;
	var node = getNode(nodes, context.nodeId);
	var nextNodeId = getNextNodeId(node.options, text);
	
	if (nextNodeId == -1) {
		var msg = {
				message : "Invalid option. " + context.message,
				options : context.options
		}
		res.send(msg);
		return;
	}
	
	context.nodeId = nextNodeId;
	node = getNode(nodes, nextNodeId);
	setMessage(context, node);
	
	var msg = {
			message : context.message,
			options : context.options
	}
	res.send(msg);
});


app.all("/use", function(req, res) {
	const sessionId = getSessionId(req);
	const text = getValue(req, "text") || "";

	console.log("use: " + text);
	
	var user = users[sessionId];
	if (!user) {
		var message = "No books available. Please set the books first.";
		res.send(message);
		return;
	}
	
	var match = text.match(/book\s+(\S+)/i);
	if (!(match)) {
		var message = "Invalid command. Which book would you like to use? Say one of the following:";
		var msg = {
				message : message,
				options : getBookOptions(user.books) 
		}
		res.send(msg);
		return;
	}
	
	var bookId;
	var books = user.books;
	
	for (var i in books) {
		if (i == match[1] || soundex(i) == soundex(match[1]))
			bookId = i;
	}
	
	var book = books[bookId];
	
	if (!(book && book.url)) {
		var message = "Book " + bookId + " is not valid. Say one of the following:";
		var msg = {
				message : message,
				options : getBookOptions(user.books) 
		}
		res.send(msg);
		return;
	}

	var context = user.context
	
	context.bookId = bookId;
	context.book = book;
	
	var bookUrl = book.url;
	var options = {
			url: bookUrl,
			json: true
	};
	console.log("Getting book " + bookId + " from " + options.url);
	request(options, function(error, response, body) {
		if (error || response.statusCode !== 200) {
			console.error(error);
			res.send("Unable to retrieve book " + bookId + " from " + bookUrl + ". Please try again later.");
			return;
		}
		
		book.flows = body;

		var flowUrl = bookUrl.replace(/\/flows/, "/flow");
		var apiUrl = flowUrl.match("http(.*?)\/\/(.*?)(\/|$)")[0];
		apiUrl = apiUrl.substring(0, apiUrl.length-1);
		var chapters = {};
		
		var i = 1;
		for (var j in body) {
			var flow = body[j];
			if (flow && flow.type && flow.type == "tab" && flow.label && flow.label.toLowerCase().indexOf("chapter") == 0) {
				chapters[numbers[i]] = flow;
				i++;
			}
		}

		book.flowUrl = flowUrl;
		book.apiUrl = apiUrl;
		book.chapters = chapters;
		
		var msg = {
				message : "How would you like to start the chapters? Say one of the following:",
				options : getChapterOptions(chapters)
		}
		res.send(msg);
	})
	
});

app.all("/list", function(req, res) {
	const sessionId = getSessionId(req);
	const text = getValue(req, "text") || "";
	
	var user = users[sessionId];
	if (!user) {
		var message = "No books available. Please set the books first.";
		res.send(message);
		return;
	}
		
	var match = text.match(/book/i);
	if (match) {
		var msg;
		if (user.books) {
			var message = "Here are the available book(s):";
			var options = [];
			for (var i in user.books) {
				options.push(i + " : " + user.books[i].url);
			}
			msg = {
					message : message,
					options : options
			}
		} else
			msg = "No books available. Please set the books first.";
		res.send(msg);
		return;
	}
	
	match = text.match(/chapter/i);
	if (match) {
		var msg;
		var context = user.context;
		if (context && context.book && context.book.chapters) {
			var message = "Here are the available chapter(s):";
			var options = [];
			var chapters = context.book.chapters;
			for (var i in chapters) {
				options.push(i + " : " + chapters[i].label);
			}
			msg = {
					message : message,
					options : options 
			}
		} else {
			var message = "No chapters available. Please select a book to use first. Say one of the following:";
			msg = {
					message : message,
					options : getBookOptions(user.books) 
			}
		}
		res.send(msg);
		return;
	}

	var message = "Invalid command. You can either list books or list chapters only.";
	res.send(message);
	return;
});




app.all(["/help"], function(req, res) {
	var help = [];
	help.push("help - Show this help");
	help.push("set <KEY> <VALUE> - Set parameters value");
	help.push("get <KEY> - Get parameters value");
	help.push("set book <BOOKID> <URL> - Set bookId and URL");
	help.push("use book <BOOKID> - Select / load bookId to use");
	help.push("start chapter <CHAPTERID> - Start a chapter from the selected book");
	help.push("start all chapters [in random] - Start all chapters in order (default) or in random");
	help.push("reply - Reply answer to the question provided");
	help.push("list (books|chapters) - List out the available books or chapters");	
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

function transformFlow(doc) {
	if (typeof doc == "string")
		doc = JSON.parse(doc);
	var flow = doc.nodes || [];
	
	var targets = [];
	var counter = {};
	for (var i in flow) {
		var target = {};
		var node = flow[i];
		if (node.type != "switch") continue;
		
		var match = node.name.match(/(.*?)(\|(.*)|$)/);
		target.message = match[1] || "";
		var description = match[3];
		if (description && description != "")
			target.description = description;
		var current = counter[node.id] || (Object.keys(counter).length + 1);
		counter[node.id] = current;
		target.node = current;
		target.id = node.id;

		var options = {};
		for (var j in node.rules) {
			var rule = node.rules[j];
			if (rule.vt == "str" && node.wires[j] && node.wires[j][0]) {
				options[rule.v] = counter[node.wires[j][0]] || (Object.keys(counter).length + 1);
				counter[node.wires[j][0]] = options[rule.v];
			}
		}
		target.options = options;
		targets.push(target);
	}
	return targets;
}

function getChapterId(chapters, option) {
	var i = 1;
	for (var j in chapters) {
		if (option == i || option == numbers[i] || option == j)
			return j;
		i++;
	}
	
	if (!isNaN(option))
		option = numbers[option];
	option = soundex(option);
	i = 1;
	for (var j in chapters) {
		if (soundex(j) == option || soundex(numbers[i]) == option)
			return j;
		i++;
	}
	return -1;
}
function getNodes(chapter, flowUrl, cb) {
	if (chapter.nodes) {
		cb(chapter.nodes);
		return;
	}
	
	var options = {
			url: flowUrl + "/" + chapter.id,
			json: true
	};
	console.log("Getting flow from " + options.url);
	request(options, function(error, response, body) {
		if (error || response.statusCode !== 200) {
			console.error(error);
			cb(false);
		}

		cb(transformFlow(body));
	})
}
function isEndNode(node) {
	var options = Object.keys(node.options);
	
	if (options.length > 0) return false;
	return true;	
}
function getNode(nodes, nodeId) {
	for (var i in nodes) {
		if (nodes[i].node == nodeId) 
			return nodes[i];
	}
	
	return -1;
}
function getNextNodeId(options, text) {
	var text = text.trim().toLowerCase();
	console.log("text: " + text);
	var i = 1;
	for (var j in options) {
		j = j.trim().toLowerCase();
		if (j == text || numbers[i] == text || i == text)
			return options[j];
		i++;
	}

	if (!isNaN(text))
		text = numbers[text];
	text = soundex(text);
	console.log("text: " + text);
	i = 1;
	for (var j in options) {
		if (soundex(j) == text || soundex(numbers[i]) == text)
			return options[j];
		i++;
	}
	
	return -1;
}
function showOptions(options) {
	var message = "Option ";
	
	for (var j in options)
		message += numbers[parseInt(j)+1] + " is " + options[j] + ", ";
	
	message = message.replace(/,\s+$/, ".")
		
	if (options.length > 1)
		message = message.replace(/,([^,]*)$/, " and" + '$1');
	
	return message;
}
function setMessage(context, node) {	
	if (node == -1) {
		context.message = "Unable to retrieve node.";
		context.options = [];
		return;
	}
	
	var nodeId = node.node;
	
	var actionUrl;
	var message = node.message;
	if (message.indexOf("/") != 0)
		message += ".";
	else {
		actionUrl = message;
		message = "Sent request to " + message + ".";
	}
	message = message.replace("\.\s*\.$", ".");
	
	if (actionUrl) {
		var url = context.book.apiUrl + actionUrl;
		request(url, function(error, response, body) {
			if (error || response.statusCode !== 200) {
				console.log("error sending request to " + url);
				console.log(error);
			} else {
				console.log("successfully sent request to " + url);
				console.log("====================================");
				console.log(body);
				console.log("====================================");
			}
		})
	}
	
	var description = "";
	if (node.description)	description = node.description;
	context.description = description;		
	
	if (description != "")
		message += " " + description + ".";
	message = message.replace("\.\s*\.$", ".");

	if (isEndNode(node)) {
		context.hasEnded = true;
		if (context.allChapters) {
			if (hasNextChapter(context.chapters, context.visitedChapters)) {
				context.continue = true;
				message += " Chapter " + numbers.indexOf(context.chapterId) + " has ended.";
				message += " Do you want to continue the next chapter?";
			} else {
				context.continue = false;
				message += " All chapters in book " + context.bookId + " has ended.";
				message += " Do you want to restart?";				
			}
		} else {
			message += " Chapter " + numbers.indexOf(context.chapterId) + " has ended.";
			message += " Do you want to restart?";				
		}
	}
	
	context.message = message;

	var options = [];
	if (context.hasEnded) {
		options.push("1 : yes");
		options.push("2 : no");
	} else {
		var keys = Object.keys(node.options);
		for (var i in keys)
			options[i] = (parseInt(i)+1) + " : " + keys[i];
	}

	context.options = options;
}
function getChapterOptions(chapters) {
	var i = 1;
	var options = [];
	for (var j in chapters) {
		options.push("start chapter " + i + " (for " + chapters[j].label + ")");
		i++;
	}

	options.push("start all chapters in order");
	options.push("start all chapters in random");
	
	return options;
}
function getBookOptions(books) {
	var options = [];
	for (var j in books)
		options.push("use book " + j);
	return options;
}
function getNextChapterId(chapters, chapterId) {
	var keys = Object.keys(chapters);
	
	if (!(chapterId)) {
		if (keys.length > 0) {
			return keys[0];
		}
		return -1;
	}
	
	var returnNext = false;
	for (var i in keys) {
		if (returnNext)
			return keys[i];
		if (keys[i] == chapterId)
			returnNext = true;
	}
	
	return -2;
}

function getNextRandomChapterId(chapters, visitedChapters) {
	if (Object.keys(chapters).length == 0)
		return -1;
		
	var ids = Object.keys(chapters).filter(function(item) {
	    return visitedChapters.indexOf(item) === -1;
	});
	
	if (ids.length == 0) return -2;
	
	return ids[Math.floor(Math.random()*ids.length)];
}


function hasNextChapter(chapters, visitedChapters) {
	console.log("chapters: ");
	console.log(chapters);
	console.log("visitedChapters: ");
	console.log(visitedChapters);
	var ids = Object.keys(chapters).filter(function(item) {
	    return visitedChapters.indexOf(item) === -1;
	});
	
	if (ids.length == 0) return false;
	return true
}

function startChapter(context, chapterId, next, cb) {
	var bookId = context.bookId;
	var book = context.book;
	var chapters = context.chapters; 
	var chapter = chapters[chapterId];
	getNodes(chapter, book.flowUrl, (nodes) => {
		chapter.nodes = nodes;
		context.nodes = nodes;
		context.chapterId = chapterId;

		context.hasEnded = false;
		if (!next)
			context.visitedChapters = [];
		context.visitedChapters.push(chapterId);
		context.nodeId = 1;
		var node = getNode(nodes, 1);
		setMessage(context, node);
		var msg = {
				message : context.message,
				options : context.options
		}
		cb(msg);
	})
}

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});