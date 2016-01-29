var express=require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname+'/'));
http.listen(3000, function(){
  console.log('listening on *:3000');
});

var people={},couples={};

function is_username_taken(username){
	for(var name in people){
		if (username==name) {
			return true;
		}
	}
	return false;
}
function is_reciever_available(username){
	for(var name in people){
		if (username==name) {
			return true;
		}
	}
	return false;
}
function find_in_couples(username){
	for(var name in couples){
		if (username==name) {
			return username;
		}else if(couples[name]==username){
			return name;
		}
	}
	return null;
}
function get_partner_name(username){
	for(var name in couples){
		if (username==name) {
			return couples[username];
		}else if(couples[name]==username){
			return name;
		}
	}
	return null;
}

io.sockets.on('connection', function (socket){

	socket.on('user_entry',function(name){
		socket.username=name;
		if(is_username_taken(name)){
			socket.emit('user_entry_ack','no');
		}else{
			socket.emit('user_entry_ack','yes');
			people[name]=socket.id;
			console.log(socket.username+" joined with id: "+people[socket.username]);
		}
	});

	socket.on('recv_name',function(name){
		//here name is the name of the client to whom the request has to be sent
		//and socket.username is the name of the client who sent the request
		if(is_reciever_available(name)){
			io.sockets.connected[people[name]].emit('allow_access',socket.username);
			socket.emit('pending_request',name);
		}else{
			socket.emit('recv_name_ack','no');
		}
	});

	socket.on('allow_access_reply',function(reply,name){
		//here name is the name of the client who requested the connection
		//and socket.username is the names of the client to whom the request was sent originally
		if (reply=="yes") {
			io.sockets.connected[people[name]].emit('recv_name_ack','yes');
			couples[socket.username]=name;
			console.log(socket.username+" and "+name+" are chatting now");
			// io.sockets.connected[people[name]].emit('new_partner',socket.username);
		}else{
			io.sockets.connected[people[name]].emit('recv_req_reject',socket.username);
		}
	});

	socket.on('chat_message',function(reciever,msg){
		// console.log("Sender: "+socket.username+" Reciever: "+reciever+" Message: "+msg);
		// console.log("Sender: "+people[socket.username]+" Reciever: "+people[reciever]+" Message: "+msg);
		io.sockets.connected[people[reciever]].emit('chat_message',socket.username,msg)
	});

	//On user disconnect
	socket.on('disconnect',function(){
		console.log(socket.username+" quit");
		var index=find_in_couples(socket.username);
		var friend=get_partner_name(socket.username);
		console.log("Sending quit request to "+friend);
		if(friend!=null){
			io.sockets.connected[people[friend]].emit('recv_quit');
			console.log("The conversation between "+socket.username+" and "+friend+" has been closed");
			delete couples[index];
			delete people[friend];
		}
		delete people[socket.username];
	});

});
