var socket = io.connect({
    'reconnect': true, 'reconnection delay': 1000, 'max reconnection attempts': 60
});

var username = (prompt("누구세요?") || ('user' + Math.floor(1000 + Math.random() * 9000))).trim();
var me = null;

socket.on('connect', function(){
    socket.emit('login', { username: (me && me.username) || username });
});

socket.on('login', function(data){
    if(data.success){
        me = data;

        appendMessage(createUsernameSpan(me) + "님, 안녕하세요!", ' disabled');
        $("#messageInput").focus();
    }else{
        appendMessage("잘못된 닉네임입니다. 페이지를 새로고침하세요.", ' list-group-item-danger');
        $("#messageInputField *").prop('disabled', true);
    }
});

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

var colors = shuffleArray([
    "red",
    "pink",
    "purple",
    "deep-purple",
    "indigo",
    "blue",
    "light-blue",
    "cyan",
    "teal",
    "green",
    "light-green",
    //"lime",
    //"yellow",
    "amber",
    "orange",
    //"deep-orange",
    "brown",
    //"grey",
    "blue-grey"
]);

function appendMessage(message, otherClasses){
    $("#chatRoom").append('<li class="list-group-item' + (otherClasses || '') + '">' + message + '</li>').find('.username').tooltip();
    if(!$("button#lockScrollButton").hasClass('active')) scroll();
};

function createUsernameSpan(data){
    return '<span class="username color-' + colors[Math.abs(hashCode(data.username)) % colors.length] + '" title="' + data.address + '">' + data.username + '</span>'
}

function onMessage(data){
    appendMessage(createUsernameSpan(data) + ' ' + $('<span>').text(data.message).html());
}

function onJoinMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 입장하셨습니다.');
}

function onLeftMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 퇴장하셨습니다.');
}

socket.on('message', onMessage);
socket.on('message join', onJoinMessage);
socket.on('message left', onLeftMessage);

function sendMessage(){
    var text = $("#messageInput").val();
    if(text){
        socket.emit('message', text);

        $("#messageInput").val('');
        $("#messageInput").focus();
    }
}

socket.on('disconnect', function(){
    appendMessage("이런, 서버와의 연결이 끊겼습니다. 재연결을 시도합니다!", ' list-group-item-warning');
});

socket.on('command', function(data){
    if(data.request) appendMessage(createUsernameSpan(me) + ' ' + data.request, ' disabled');
    switch(data.what){
        case 'online':
            appendMessage("온라인: " + data.response.map(createUsernameSpan).join(', '), ' disabled');
            break;
    }
})

function scroll(){
    $("html, body").scrollTop($(document).height());
}

$(function(){
    $("button#messageSendButton").click(sendMessage);
    $("input#messageInput").keydown(function(e){
        if(e.keyCode === 13) sendMessage();
    });

    $("button#lockScrollButton").click(function(){
        $(this).toggleClass('active');
        $(this).blur();
    });

    function resize(){
        $(".container").css('padding-bottom', ($(".navbar-fixed-bottom").outerHeight() + 16) + "px");
    }

    resize();

    $(window).resize(resize);
    $("html, body").on("scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove", function(){
        $("html, body").stop();
    });
});
