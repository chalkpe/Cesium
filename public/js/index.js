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

function shuffleArray(array){
    return array.map(function(element){
        return [Math.random(), element];
    }).sort().map(function(element){
        return element[1];
    });
}

function distinctArray(array){
    return array.filter(function(element, index){
        return array.indexOf(element) === index;
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

function createUserSpan(user){
    return !user ? '' : $('<span>').addClass(colors[Math.abs(hashCode(user.username)) % colors.length] + "-text username tooltipped").attr('data-tooltip', "@" + user.username).text(user.displayName).toHTML();
}

function createDateSpan(date){
    return !date ? '' : $('<span>').addClass("grey-text date tooltipped").attr('data-tooltip', moment(date).format('YYYY-MM-DD HH:mm:ss')).text(moment(date).format("HH:mm")).toHTML();
}

function onConnect(){
    socket.emit('login');
}

function onLogin(data){
    console.log(data);

    appendMessage(createUserSpan(data) + "님, 안녕하세요!", ['grey', 'lighten-3']);
    $("#messageInput").focus();
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

// 명령를 전송하는 경우
function onCommand(data){
    if(data.command) appendMessage(createUserSpan(data.command.sender) + ' ' + data.command.text, ['grey', 'lighten-3']);

    switch(data.name){
        case 'online':
            // 접속자 확인
            appendMessage("온라인: " + distinctArray(data.response.map(createUserSpan)).join(', '), ['grey', 'lighten-3']);
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
}

function onDisconnected(){
    appendMessage("이런, 서버와의 연결이 끊겼습니다.", ['red', 'lighten-3']);
}

function onReconnecting(){
    appendMessage("재연결을 시도하는 중입니다….", ['amber', 'lighten-3']);
}

function sendMessage(){
    var text = $("#messageInput").val();
    if(text){
        socket.emit('message', { text: text });
        $("#messageInput").val('');
    }
    $("#messageInput").focus();
}

// 챗방 메시지 목록에 메시지 축가
function appendMessage(text, otherClasses){
    var item = $('<li>').html(text).addClass("collection-item" + ((otherClasses && (' ' + otherClasses.join(' '))) || ''));
    $("#chatRoom").append(item).find('.tooltipped').tooltip({ delay: 50 });
    if(hasScrolledToBottom) scrollToBottom();
}

var socket = io.connect({
    'port': 671, 'force new connection': true, 'reconnect': true,
    'reconnection delay': 1000, 'max reconnection attempts': 60
});

socket.on('connect', onConnect);
socket.on('login', onLogin);
socket.on('message', onMessage);
socket.on('command', onCommand);
socket.on('user join', onUserJoin);
socket.on('user left', onUserLeft);
socket.on('disconnect', onDisconnected);
socket.on('reconnecting', onReconnecting);

var hasScrolledToBottom = true;
$(window).scroll(function(){
    hasScrolledToBottom = ($(window).scrollTop() + $(window).height()) > ($(document).height() - ($("#messageBox").outerHeight() + 32));
});

function scrollToBottom(){
    $("html, body").scrollTop($(document).height());
}

$(function(){
    $("#chatRoom").css('margin-bottom', ($("#messageBox").outerHeight() + 8) + "px");
    $("#messageInput").keydown(function(e){ if(e.keyCode === 13) $("#messageSendButton").click(); });
    $("#messageSendButton").click(sendMessage);
});
