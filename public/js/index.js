/*
 * Copyright (C) 2015-2016  ChalkPE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
    'too-short': "The nickname is too short",
    'too-long': "The nickname is too long",
    'wrong-format': "Invalid format",
    'duplicate': "The nickname is already in use"
};

socket.on('login', function(data){
    if(!data.success){
        $("#nicknameInput").removeClass('valid').addClass('invalid');
        $("#nicknameInput").next("label").attr('data-error', reasons[data.reason]);
        return;
    }

    $("#nicknameInput").removeClass('invalid').addClass('valid');
    $("#nicknameModal").closeModal();

    appendMessage(createUserSpan(me = data.user) + "님, 안녕하세요!", ['grey', 'lighten-3']);
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

$.fn.toHTML = function(element){
    return $('<span>').append(this.clone()).html();
};

function escape(text){
    return $('<span>').text(text).html();
}

// 챗방 메시지 목록에 메시지 축가
function appendMessage(text, otherClasses){
    var item = $('<li>').html(text).addClass("collection-item" + ((otherClasses && (' ' + otherClasses.join(' '))) || ''));
    $("#chatRoom").append(item).find('.tooltipped').tooltip({ delay: 50 });
    if(hasScrolledToBottom) scrollToBottom();
}

function createUserSpan(user){
    return !user ? '' : $('<span>').addClass(colors[Math.abs(hashCode(user.nickname)) % colors.length] + "-text username tooltipped").attr('data-tooltip', user.address).text(user.nickname).toHTML();
}

function createDateSpan(date){
    return !date ? '' : $('<span>').addClass("grey-text date tooltipped").attr('data-tooltip', moment(date).format('YYYY-MM-DD HH:mm:ss')).text(moment(date).format("HH:mm")).toHTML();
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
    appendMessage("이런, 서버와의 연결이 끊겼습니다.", ['red', 'lighten-2']);
});

socket.on('reconnecting', function(){
    appendMessage("재연결을 시도하는 중입니다….", ['amber', 'lighten-2']);
})

// 명령를 전송하는 경우
socket.on('command', function(data){
    if(data.request) appendMessage(createUserSpan(me) + ' ' + data.request, ['grey', 'lighten-3']);

    switch(data.what){
        case 'online':
            // 접속자 확인
            appendMessage("온라인: " + data.response.map(createUserSpan).join(', '), ['grey', 'lighten-3']);
            break;

        case 'clear':
            // 청소
            $("#chatRoom").empty();
            appendMessage("방을 청소했습니다.", ['grey', 'lighten-3']);
            break;

        case 'invalid':
            // 명령어 오류
            appendMessage("존재하지 않는 명령어입니다.", ['grey', 'lighten-3']);
            break;

        case 'alert plaster':
            // 채팅금지 시간 전송 (도배)
            appendMessage("반복적인 메시지 전송으로 " + (data.response / 1000).toFixed(1).toString() + "초 동안 채팅이 차단되어 있습니다.", ['grey', 'lighten-3']);
            break;
    }
})

var hasScrolledToBottom = true;
$(window).scroll(function(){
    hasScrolledToBottom = ($(window).scrollTop() + $(window).height()) > ($(document).height() - ($("#messageBox").outerHeight() + 32));
});

function scrollToBottom(){
    $("html, body").scrollTop($(document).height());
}

$(function(){
    $(".dropdown-button").dropdown();
    $(".button-collapse").sideNav();
    $('.tooltipped').tooltip({ delay: 50 });

    $("#messageSendButton").click(sendMessage);
    $("#messageInput").keydown(function(e){
        if(e.keyCode === 13) sendMessage();
    });

    $("#chatRoom").css('margin-bottom', ($("#messageBox").outerHeight() + 16) + "px");

    $("#nicknameInput").attr('data-tooltip', "user" + Math.floor(1000 + 9000 * Math.random())).keydown(function(e){
        if(e.keyCode === 13) $("#nicknameSendButton").click();
        $("#nicknameInput").next("label").attr('data-error', "");
    });

    $("#nicknameSendButton").click(function(){
        var val = $("#nicknameInput").val();
        if(!val || val.trim().length === 0) val = $("#nicknameInput").attr('data-tooltip');

        socket.emit('login', { nickname: nickname = val });
    });

    $("#nicknameModal").openModal({
        dismissible: false,
        ready: function(){
            $("#nicknameInput").focus();
        }
    });
});
