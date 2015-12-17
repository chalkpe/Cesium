var socket = io.connect({
    'port': 671, 'force new connection': true,
    'reconnect': true, 'reconnection delay': 1000, 'max reconnection attempts': 60
});

var nickname = null;
var me = null;

socket.on('connect', function(){
    if(nickname) socket.emit('login', { nickname: nickname });
});

var reasons = {
    'empty': "The nickname is empty",
    'too-long': "The nickname is too long",
    'wrong-format': "Invalid format",
    'duplicate': "The nickname is already in use"
};

socket.on('login', function(data){
    if(!data.success){
        $("#nicknameFormGroup").addClass('has-error');
        $("#nicknameInput").attr('data-original-title', reasons[data.reason]).tooltip('show');
        return;
    }

    $("#nicknameModal").modal('hide');
    appendMessage(createUserSpan(me = data.user) + "님, 안녕하세요!", ' disabled');
    $("#messageInput").focus();
});

function shuffleArray(array){
    return array.map(function(element){
        return [Math.random(), element];
    }).sort().map(function(element){
        return element[1];
    });
}

function hashCode(str){
    return str ? str.split("").reduce(function(a,b){ a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0) : 0;
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

function escape(text){
    return $('<span>').text(text).html();
}

// 챗방 메시지 목록에 메시지 축가
function appendMessage(text, otherClasses){
    $("#chatRoom").append('<li class="list-group-item' + (otherClasses || '') + '">' + text + '</li>').find('[data-toggle="tooltip"]').tooltip();
    if(!$("button#lockScrollButton").hasClass('active')) scrollToBottom();
};

function createUserSpan(user){
    return !user ? '' : '<span data-toggle="tooltip" class="username color-' + colors[Math.abs(hashCode(user.nickname)) % colors.length] + '" title="' + user.address + '">' + escape(user.nickname) + '</span>';
}

function createDateSpan(date){
    return !date ? '' : '<span data-toggle="tooltip" class="date color-grey" title="' + moment(date).format('YYYY-MM-DD HH:mm:ss') + '">' + moment(date).format("HH:mm") + '</span>';
}

// 메시지를 수신할 경우
function onMessage(message){
    appendMessage(createUserSpan(message.sender) + ' ' + escape(message.text) + ' ' + createDateSpan(message.date));
}

// 입장 메시지를 수신하는 경우
function onUserJoin(user){
    appendMessage(createUserSpan(user) + '님이 입장하셨습니다.');
}

// 퇴장 메시지를 수신하는 경우
function onUserLeft(user){
    appendMessage(createUserSpan(user) + '님이 퇴장하셨습니다.');
}

socket.on('message', onMessage);
socket.on('user join', onUserJoin);
socket.on('user left', onUserLeft);

// 메시지를 발신하는 경우
function sendMessage(){
    var text = $("#messageInput").val();
    if(text){
        socket.emit('message', { text: text });
        $("#messageInput").val('');
    }

    $("#messageInput").focus();
}

socket.on('disconnect', function(){
    appendMessage("이런, 서버와의 연결이 끊겼습니다.", ' list-group-item-warning');
});

socket.on('reconnecting', function(){
    appendMessage("재연결을 시도하는 중입니다….", ' list-group-item-warning');
})

// 명령를 전송하는 경우
socket.on('command', function(data){
    if(data.request) appendMessage(createUserSpan(me) + ' ' + data.request, ' disabled');

    switch(data.what){
        case 'online':
            // 접속자 확인
            appendMessage("온라인: " + data.response.map(createUserSpan).join(', '), ' disabled');
            break;

        case 'clear':
            // 청소
            $("#chatRoom").empty();
            appendMessage("방을 청소했습니다.", ' disabled');
            break;

        case 'invalid':
            // 명령어 오류
            appendMessage("존재하지 않는 명령어입니다.", ' disabled');
            break;

        case 'alert plaster':
            // 채팅금지 시간 전송 (도배)
            appendMessage("반복적인 메시지 전송으로 " + (data.response / 1000).toFixed(1).toString() + "초 동안 채팅이 차단되어 있습니다.", ' disabled');
            break;
    }
})

function scrollToBottom(){
    $("html, body").scrollTop($(document).height());
}

$(function(){
    $('[data-toggle="tooltip"]').tooltip();

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
    } resize(); $(window).resize(resize);

    $("html, body").on('scroll mousedown wheel DOMMouseScroll mousewheel touchmove', function(){
        $("html, body").stop();
    });

    $("#nicknameInput").attr('placeholder', "user" + Math.floor(1000 + 9000 * Math.random())).keydown(function(e){
        if(e.keyCode === 13) $("#nicknameSendButton").click();
    }).on('validate.bs.validator', function(){
        $("#nicknameInput").tooltip('hide').tooltip('destroy');
    }).validator({ delay: 0 });

    $("#nicknameSendButton").click(function(){
        var val = $("#nicknameInput").val();
        if(!val || val.trim().length === 0) val = $("#nicknameInput").attr('placeholder');

        socket.emit('login', { nickname: nickname = val });
    });

    $("#nicknameModal").on('shown.bs.modal', function(e){
        $("#nicknameInput").focus();
    }).modal('show');
});
