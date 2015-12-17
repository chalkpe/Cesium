/*
 * Copyright (C) 2015  ChalkPE
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

var http = require('http');
var express = require('express');

var path = require('path');
var logger = require('morgan');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
app.set('port', '671');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));

app.use(function(req, res, next){
    var err = new Error('Not Found');
    err.status = 404; next(err);
});

if(app.get('env') === 'development'){
    app.use(function(err, req, res, next){
        res.status(err.status || 500);
        res.render('error', { message: err.message, error: err });
    });
}

var server = http.createServer(app);
var io = require('socket.io')(server);

var User = require('./models/User');
var Message = require('./models/messages/Message');
var Command = require('./models/messages/Command');

Function.prototype.and = function(other){
    var that = this;
    return function(){
        return that.apply(null, arguments) && other.apply(null, arguments);
    }
}

var Sockets = {
    that: {
        is: {
            authorized: function(socket){
                return socket.user && socket.user.nickname;
            }
        },
        has: function(key, value){
            return function(socket){
                return socket.user[key] === value;
            };
        }
    },
    to: {
        user: function(socket){
            return socket.user;
        }
    },

    get: function(room, namespace, filter, mapper){
        var sockets = [];
        namespace = io.of(namespace || '/');

        if(namespace) for(var id in namespace.connected){
            if(!room || namespace.connected[id].rooms.indexOf(room) >= 0){
                var socket = namespace.connected[id];
                if(!filter || filter.call(null, socket)) sockets.push(!mapper ? socket : mapper.call(null, socket));
            }
        }
        return sockets;
    },

    getOnlineUsers: function(room, namespace){
        return Sockets.get(room, namespace, Sockets.that.is.authorized, Sockets.to.user);
    },
    findOnlineUsersByNickname(nickname, room, namespace){
        return Sockets.get(room, namespace, Sockets.that.is.authorized.and(Sockets.that.has('nickname', nickname)), Sockets.to.user);
    }
};

var Commands = {
    emit: function(command, what, response){
        (command.socket || command.sender.socket).emit('command', {
            what: what || command.name || null,
            request: command.text || null,
            response: response || null
        });
    },

    client: {
        online: function(command){
            Commands.emit(command, 'online', Sockets.getOnlineUsers());
        },
        clear: function(command){
            Commands.emit(command, 'clear');
        }
    },

    server: {
        alertPlaster: function(command, prohibitedPeriod){
            Commands.emit(command, 'alert plaster', prohibitedPeriod);
        }
    }
};

io.on('connection', function(socket){
    socket.on('login', function(data){
        if(socket.user){
            socket.emit('login', { success: true, done: true });
            return;
        }

        if(!data.nickname || (data.nickname = data.nickname.trim()).length === 0){
            socket.emit('login', {
                success: false,
                reason: "empty"
            }); return;
        }

        if(data.nickname.length > 20){
            socket.emit('login', {
                success: false,
                reason: 'too-long'
            }); return;
        }

        if(!/^[A-Za-z0-9-_. ㄱ-ㅎㅏ-ㅣ가-힣]{1,20}$/.test(data.nickname)){
            socket.emit('login', {
                success: false,
                reason: 'wrong-format'
            }); return;
        }

        if(Sockets.findOnlineUsersByNickname(data.nickname).length > 0){
            socket.emit('login', {
                success: false,
                reason: 'duplicate'
            }); return;
        }

        socket.user = new User({ socket: socket, nickname: data.nickname });
        socket.emit('login', { success: true, user: socket.user });
        Commands.client.online(socket.user);

        io.emit('user join', socket.user);
    });

    socket.on('message', function(data){
        if(!socket.user) return;
        data.sender = socket.user;

        // 내용이 없는 경우 전송 안함
        if(!data.text || data.text.trim().length === 0) return;

        // 도배 방지
        var elapsedTime = Math.abs(Date.now() - ((socket.user.lastMessage && socket.user.lastMessage.date) || 0));
        var limitInterval = Message.MIN_SENDING_INTERVAL + Message.PROHIBITION_PERIOD * socket.user.plasteredCount;

        if(elapsedTime < limitInterval){
            if(++socket.user.plasteredCount > 3){
                Commands.server.alertPlaster(socket.user, Message.MIN_SENDING_INTERVAL + Message.PROHIBITION_PERIOD * socket.user.plasteredCount - elapsedTime);
                return;
            }
        }else socket.user.plasteredCount = 0;

        // 명령어 처리
        if(data.text.startsWith('/')){
            var command = socket.user.lastCommand = new Command(data);
            switch(command.name.toLowerCase()){
                case 'online':
                    Commands.client.online(command);
                    break;
                case 'clear':
                    Commands.client.clear(command);
                    break;

                default:
                    Commands.emit(command, 'invalid');
                    break;
            }
        }else io.emit('message', socket.user.lastMessage = new Message(data));
    });

    socket.on('disconnect', function(){
        if(!socket.user) return;
        socket.broadcast.emit('user left', socket.user);
    });
});

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});
