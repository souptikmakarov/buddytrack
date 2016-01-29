var socket = io.connect('http://192.168.43.115:3000', {'sync disconnect on unload': true });	

// on connection to server
socket.on('connect', function(){
	get_username();
});
var my_username = '',recv_username='';
$('input[type="submit"]').prop("disabled",true);

//Takes input username and sends it to server to check whether valid or not
function get_username(){
	my_username=prompt('Enter your username');
	if (my_username.length==0 ||  my_username==null){
		get_username();
	}
	socket.emit('user_entry',my_username);
}

//Server sends acknowledgement whether username is valid or not
socket.on('user_entry_ack',function(msg){
	if (msg=="yes") {
		$('.left').append("<p class='ctrl_msg'>You are now connected to the server as "+my_username+"</p>");
		$('.left').append("<button id='recv_adder' onclick='get_reciever_username()'>Add reciever</button>");
	}else{
		alert("Please enter a different username");
		recv_username='';
		get_username();
	}
});

//Sends username of reciever to server to check whether reciever is available or not
function get_reciever_username(){
	recv_username=prompt("Enter reciever's username");
	if (recv_username.length==0 ||  recv_username==null || recv_username==my_username){
		get_username();
	}
	socket.emit('recv_name',recv_username);
}

//Server sends availibility of reciever
socket.on('recv_name_ack',function(msg){
	if (msg=="yes") {
		$('input[type="submit"]').prop("disabled",false);
		$('#recv_adder').remove();
		$('#pending-request').remove();
		$('.left').append("<p class='ctrl_msg'>You are now chatting with "+recv_username+"</p>");
	}else{
		alert("Reciever is not available. Please try a different username.");
		recv_username='';
		get_reciever_username();
	}
});

socket.on('allow_access',function(name){
	var reply=confirm(name+" wants to start a conversation with you\nPress OK to allow and Cancel to deny");
	if(reply==true){
		socket.emit('allow_access_reply','yes',name);
		$('#recv_adder').remove();
		$('.left').append("<p class='ctrl_msg'>You are now chatting with "+name+"</p>");
		recv_username=name;
		$('input[type="submit"]').prop("disabled",false);
	}else{
		socket.emit('allow_access_reply','no',name);
	}
});

socket.on('pending_request',function(name){
	$('#recv_adder').remove();
	$('.left').append("<p class='ctrl_msg' id='pending-request'>Pending request confirmation from "+name+"</p>");
});

socket.on('recv_req_reject',function(name){
	alert(name+" has rejected your request to connect. Please try again");
	$('.left').append("<button id='recv_adder' onclick='get_reciever_username()'>Add reciever</button>");
	get_reciever_username();
});

// socket.on('new_partner',function(name){
// 	$('#recv_adder').remove();
// 	$('.left').append("<p class='ctrl_msg'>You are now chatting with "+name+"</p>");
// 	recv_username=name;
// 	$('input[type="submit"]').prop("disabled",false);
// });

//Sends message
$('form').submit(function (e){
	e.preventDefault();
	var message = $('#m').val();
	if(message == '' || jQuery.trim(message).length == 0)
	return false;
	$('#m').val('');
	$('#messages').append($('<li class="sent-msg">').text(my_username+": "+message));
	console.log("Sending: "+recv_username+" "+my_username+" "+message);
	socket.emit('chat_message',recv_username,message);
});

//Recieves messages
socket.on('chat_message', function(sender,msg){
	console.log("Recieving: "+recv_username+" "+sender+" "+msg);
	$('#messages').append($('<li class="recv-msg">').text(sender+": "+msg));
});

//If user leaves
window.addEventListener("beforeunload", function (e) {
	do_when_disconnect();
	(e || window.event).returnValue = null;
	return null;
});
function do_when_disconnect(){
	socket.emit('disconnect');
}


//If reciever leaves
socket.on('recv_quit',function(){
	alert("Your friend has left the chat");
	location.reload(true);
});