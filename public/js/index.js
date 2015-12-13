var socket = io.connect();
var username = prompt("누구세요?") || ('user' + Math.floor(Math.random() * 10000));

//var colors = [ "#E91E63", "#9C27B0", "#3F51B5", "#009688", "#8BC34A", "#FFC107", "#795548", "#607D8B" ];

function appendMessage(message){
    $("#chatRoom").append('<li class="list-group-item">' + message + '</li>');
    $("html, body").animate({ scrollTop: $(document).height() }, "slow");
};

function onMessage(data){
    appendMessage('<span class="username">' + data.username + '</span> ' + $('<span>').text(data.message).html());
}

function onJoinMessage(data){
    appendMessage('<span class="username">' + data + '</span>님이 입장하셨습니다.');
}

function onLeftMessage(data){
    appendMessage('<span class="username">' + data + '</span>님이 퇴장하셨습니다.');
}

socket.emit('login', {username: username });
socket.on('message', onMessage);
socket.on('message join', onJoinMessage);
socket.on('message left', onLeftMessage);

function sendMessage(){
    var text = $("#messageInput").val();
    if(text){
        socket.emit('message', text);
        $("#messageInput").val('');
    }
}

$("button#messageSendButton").click(sendMessage);
$("input#messageInput").keydown(function(e){
    if(e.keyCode === 13) sendMessage();
});

$(function(){
    function resize(){
        $(".container").css('margin-top', ($(".navbar-fixed-top").outerHeight() + 16) + "px");
    }

    resize(); $(window).resize(resize);
});
