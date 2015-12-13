var socket = io.connect();
var username = prompt("누구세요?") || ('user' + Math.floor(Math.random() * 10000));

function shuffleArray(array){
    return array.map(function(element){
        return [Math.random(), element];
    }).sort().map(function(element){
        return element[1];
    });
}

function hashCode(str){
    return str.split("").reduce(function(a,b){ a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
}

/**
 * @todo Add other colors
 * @see https://www.google.com/design/spec/style/color.html#color-color-palette
 */
var colors = shuffleArray(["pink", "purple", "indigo", "teal", "green", "amber", "brown", "grey"]);

function appendMessage(message){
    $("#chatRoom").append('<li class="list-group-item">' + message + '</li>');
    $("html, body").animate({ scrollTop: $(document).height() }, "slow");
};

function createUsernameSpan(username){
    return '<span class="username color-' + colors[Math.abs(hashCode(username)) % colors.length] + '">' + username + '</span>'
}

function onMessage(data){
    appendMessage(createUsernameSpan(data.username) + ' ' + $('<span>').text(data.message).html());
}

function onJoinMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 입장하셨습니다.');
}

function onLeftMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 퇴장하셨습니다.');
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
