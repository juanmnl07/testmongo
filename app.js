var request = require('request'),
	express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	mongoose = require('mongoose'),
	bodyParser  = require("body-parser"),
    methodOverride = require("method-override"),
	users = {};

var emoji = require('emoji');
console.log('😎', emoji.unifiedToHTML('😎'));
	
app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());  
app.use(methodOverride());
app.use("/lib", express.static(__dirname + '/lib'));
app.use("/images", express.static(__dirname + '/images'));

server.listen(8000);

mongoose.connect('mongodb://localhost/chat', function(err){
	if(err){
		console.log(err);
	} else{
		console.log('Connected to mongodb!');
	}
});

/******* MONGO SCHEMA *********/
var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);
/******* END MONGO SCHEMA *********/

/******* MAIN ROUTE / HOME ********/
app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

/*app.get('/lib/css/nanoscroller.css', function(req, res) {
    res.sendfile(__dirname + '/lib/css/nanoscroller.css');
});

app.get('/lib/css/emoji.css', function(req, res) {
    res.sendfile(__dirname + '/lib/css/emoji.css');
});

app.get('/lib/js/nanoscroller.min.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/nanoscroller.min.js');
});

app.get('/lib/js/tether.min.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/tether.min.js');
});

app.get('/lib/js/config.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/config.js');
});

app.get('/lib/js/jquery.emojiarea.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/jquery.emojiarea.js');
});

app.get('/lib/js/emoji-picker.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/emoji-picker.js');
});

app.get('/lib/js/util.js', function(req, res) {
    res.sendfile(__dirname + '/lib/js/util.js');
});*/

/******* END MAIN ROUTE / HOME ********/

/******* API /RESTFUL ********/
var MessageCtrl = require('./controllers/message');
/**** GET ****/
app.get('/messages', MessageCtrl.findAllMessages);
app.get('/messages/:id', MessageCtrl.findMessageById);

/**** PUT ****/
app.put('/messages/:id', MessageCtrl.updateMessage);

/**** POST ****/
app.post('/messages', MessageCtrl.newMessage);

/**** DELETE ****/
app.delete('/messages/:id', MessageCtrl.deleteMessage);

// API routes
//var messRoute = express.Router();
	/******* API /RESTFUL (GET - ALL) ********/
	//messRoute.route('/messasges')
		//.get(MessageCtrl.findAllMessages);
	/******* END API /RESTFUL (GET - ALL) ********/
/******* END API /RESTFUL ********/
//app.use(messRoute);

/********** SOCKET **********/
io.sockets.on('connection', function(socket){
	var query = Chat.find({});
	query.sort('-created').limit(8).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old msgs', docs);
	});
	
	socket.on('new user', function(data, callback){
		if (data in users){
			callback(false);
		} else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});
	
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message to eliza', function(data) {
        var strArray = data.split(':');
        var strArrayMessage = strArray[1].split('-');
        var message = strArrayMessage[0];
        var fullMessage = strArray[0]+":"+strArrayMessage[0];
        var newMsg = new Chat({msg: message, nick: socket.nickname});
		newMsg.save(function(err){
			if(err) throw err;
			io.sockets.emit('new message', {msg: fullMessage, nick: socket.nickname});
		});
        //separar data
        if(strArrayMessage[1] == 'eliza'){
            request({
                url: "http://www.botlibre.com/rest/botlibre/form-chat?application=7937626380781354139&instance=857180&message="+message,
                method: "GET",
            }, function (error, response, body){
            	var newMsg = new Chat({msg: response.body, nick: '@Eliza'});
				newMsg.save(function(err){
					if(err) throw err;
					io.sockets.emit('new message', {msg: response.body, nick: '@Eliza'});
				});                
            });
        }
    });

	socket.on('send message', function(data, callback){
		var msg = data.trim();
		console.log('after trimming message is: ' + msg);
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('message sent is: ' + msg);
					console.log('Whisper!');
				} else{
					callback('Error!  Enter a valid user.');
				}
			} else{
				callback('Error!  Please enter a message for your whisper.');
			}
		} else{
			var newMsg = new Chat({msg: msg, nick: socket.nickname});
			newMsg.save(function(err){
				if(err) throw err;
				io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
			});
		}
	});
	
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});
/********** END SOCKET ************/