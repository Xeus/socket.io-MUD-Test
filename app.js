var express = require('express');
var ejs = require('ejs'); // EJS (Embedded JavaScript) https://github.com/visionmedia/ejs
var app = express.createServer(express.logger());

/*********** SERVER CONFIGURATION *****************/
app.configure(function() {
    app.set('view engine','ejs');
    app.set('views',__dirname+ '/views');
    app.set('view options',{layout:true});
    app.register('html',require('ejs'));
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var currentServerSlogan = "Welcome to Ben's socket.io MUD experiment.<BR /> ALPHA<BR /><BR />";
var cmd = "none";
var tickTime = 10000;

var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

var scrambleMsg = function(msg) {
  var scrambledMsg = ""; 
  for (var i=0; i<msg.length; i++) {
    scrambledMsg += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return scrambledMsg;
};

var translate = function(msg, origMsg) {
  var translatedMsg = ""; 
  for (var i=0; i<msg.length; i++) {
    if (Math.floor(Math.random() * train) > 2) {
      translatedMsg += origMsg[i];
    }
    else {
      translatedMsg += msg[i];
    }
  }
  return translatedMsg;
};

var skillTranslation = 0;
var train = function(skill) {
  return skill++;
};

var io = require('socket.io').listen(app);
io.configure('production', function() {
  io.set('log level', 1);
});

io.sockets.on('connection', function (socket) {

	newTick = function() {
		var tickMsg = "testing";
		socket.emit("newTick", { tickMsg: tickMsg });
		console.log("Fired");
		setTimeout(newTick, tickTime);
	};

	setTimeout(newTick, tickTime);

	socket.emit("serverSlogan", currentServerSlogan);
	socket.broadcast.emit("newClient", socket.id);

	socket.on('private message', function (from, msg) {
    	console.log('I received a private message by ', from, ' saying ', msg);
  	});

	socket.on("setServerSlogan", function (data) {
   		currentServerSlogan = data; // set it
   		socket.broadcast.emit("serverSlogan", currentServerSlogan); // tell everyone else the new slogan
 	});

 	socket.on("sendCmd", function (cmd) {
 		var command = cmd.cmd;
 		var timestamp = new Date();
 		console.log(timestamp);
 		var hours = timestamp.getHours();
    var minutes = timestamp.getMinutes();
    if (minutes < 10) {
    	minutes = "0" + minutes;
    }

   	if (command === "d" || command === "down") {
   		socket.emit("message", { msg: "[" + hours + ":" + minutes + "] User " + socket.id + " has headed " + command + "." });
    }
    else if (/gossip /).test(command) {
      var msg = command.substring(7,command.length);
      socket.emit("message", { msg: "[" + hours + ":" + minutes + "] User " + socket.id + " gossips, \"" + scrambleMsg(msg); + "\"" });
   	}
   	//console.log(msg);
   	//socket.emit("message", msg);
 	});

 	socket.on('disconnect', function () {
    	socket.broadcast.emit('user disconnected');
  	});

});

app.get('/', function(request, response) {

    var data = { mudName: "Ben's Test socket.io MUD" };
    
    response.render("index.html", data);
});

// Make server turn on and listen at defined PORT (or port 3000 if is not defined).
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});