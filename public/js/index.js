var socket = io.connect({
    'reconnect': true, 'reconnection delay': 1000, 'max reconnection attempts': 60
});

// 유저네임 설정
var username = (prompt("누구세요?") || ('user' + Math.floor(1000 + Math.random() * 9000))).trim();
var me = null;

socket.on('connect', function(){
    socket.emit('login', { username: (me && me.username) || username });
});

socket.on('login', function (data) {
    if(data.success){
        me = data;

        appendMessage(createUsernameSpan(me) + "님, 안녕하세요!", ' disabled');
        $("#messageInput").focus();
    } else {
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

// 챗방 메시지 목록에 메시지 축가
function appendMessage(message, otherClasses){
    $("#chatRoom").append('<li class="list-group-item' + (otherClasses || '') + '">' + message + '</li>').find('.username').tooltip();
    if(!$("button#lockScrollButton").hasClass('active')) scroll();
};

function createUsernameSpan(data){
    return '<span class="username color-' + colors[Math.abs(hashCode(data.username)) % colors.length] + '" title="' + data.address + '">' + data.username + '</span>'
}

// 메시지를 수신할 경우
function onMessage(data){
    appendMessage(createUsernameSpan(data) + ' ' + $('<span>').text(data.message).html());
}

// 입장 메시지를 수신하는 경우
function onJoinMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 입장하셨습니다.');
}

// 퇴장 메시지를 수신하는 경우
function onLeftMessage(data){
    appendMessage(createUsernameSpan(data) + '님이 퇴장하셨습니다.');
}

socket.on('message', onMessage);
socket.on('message join', onJoinMessage);
socket.on('message left', onLeftMessage);

// 메시지를 발신하는 경우
function sendMessage(){
    var text = $("#messageInput").val();
    if (text) {
        socket.emit('message', text);

        $("#messageInput").val('');
        $("#messageInput").focus();
    }
}

socket.on('disconnect', function(){
    appendMessage("이런, 서버와의 연결이 끊겼습니다. 재연결을 시도합니다!", ' list-group-item-warning');
});

// 커맨드를 전송하는 경우
socket.on('command', function(data){
    if(data.request) appendMessage(createUsernameSpan(me) + ' ' + data.request, ' disabled');
    switch (data.what) {
        case 'online':
            // 접속자 확인
            appendMessage("온라인: " + data.response.map(createUsernameSpan).join(', '), ' disabled');
            break;
        case 'clear':
            // 청소
            $("#chatRoom").empty();
            appendMessage("방을 청소했습니다.", ' disabled');
            break;
    }
})

// 숨겨진 커맨드를 전송하는 경우
socket.on('command-hidden', function (data) {
    switch (data.what) {
        case 'alert-plaster':
            // 채팅금지 시간 전송 (도배)
            appendMessage("반복적인 메시지 전송으로 인해, " + (data.response / 1000).toString() + "초 동안 채팅이 금지되어 있습니다.", ' disabled');
            break;
    }
})

function scroll(){
    $("html, body").scrollTop($(document).height());
}

// 입력
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
