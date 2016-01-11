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

var User = require('../models/User');
var Message = require('../models/messages/Message');
var Command = require('../models/messages/Command');

Function.prototype.and = function(other){
    var that = this;
    return function(){
        return that.apply(null, arguments) && other.apply(null, arguments);
    }
};

module.exports = function(io){
    var Sockets = {
        to: {
            user: socket => socket.request.user['0']
        },

        that: {
            is: {
                authorized: socket => socket.request.user.logged_in
            },
            has: (key, value) => (socket) => Sockets.to.user(socket)[key] === value
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
        findOnlineUsersByUsername(username, room, namespace){
            return Sockets.get(room, namespace, Sockets.that.is.authorized.and(Sockets.that.has('username', username)), Sockets.to.user);
        }
    };

    var Commands = {
        emit: function(socket, command, name, response){
            socket.emit('command', {
                name: name || (command && command.name) || null,
                command: command, response: response || null
            });
        },

        client: {
            online: function(socket, command){
                Commands.emit(socket, command, 'online', Sockets.getOnlineUsers());
            },
            clear: function(socket, command){
                Commands.emit(socket, command, 'clear');
            }
        },

        server: {
            alertPlaster: function(socket, command, prohibitedPeriod){
                Commands.emit(socket, command, 'alert plaster', prohibitedPeriod);
            }
        }
    };

    io.on('connection', function(socket){
        socket.on('login', function(data){
            if(!Sockets.that.is.authorized(socket)){
                socket.emit('login', false);
                return;
            }

            socket.emit('login', Sockets.to.user(socket));
            Commands.client.online(socket);

            io.emit('user join', Sockets.to.user(socket));
        });

        socket.on('message', function(data){
            if(!Sockets.that.is.authorized(socket)) return;
            var user = data.sender = Sockets.to.user(socket);

            // 내용이 없는 경우 전송 안함
            if(!data.text || (data.text = data.text.trim()).length === 0) return;

            // TODO: 길이 제한을 없애고, 대신 처음엔 접혀 있다가 클릭해서 펼쳐 볼 수 있도록 변경
            if(data.text.length > 1024) return;

            // 도배 방지
            var elapsedTime = Math.abs(Date.now() - ((socket.lastMessage && socket.lastMessage.date) || 0));
            var limitInterval = Message.MIN_SENDING_INTERVAL + Message.PROHIBITION_PERIOD * socket.plasteredCount;

            if(elapsedTime >= limitInterval) socket.plasteredCount = 0;
            else if(++socket.plasteredCount > 3){
                Commands.server.alertPlaster(socket, Message.MIN_SENDING_INTERVAL + Message.PROHIBITION_PERIOD * socket.plasteredCount - elapsedTime);
                return;
            }

            // 명령어 처리
            if(!data.text.startsWith('/')) io.emit('message', socket.lastMessage = new Message(data));
            else{
                var command = socket.lastCommand = new Command(data);
                switch(command.name.toLowerCase()){
                    case 'online':
                        Commands.client.online(socket, command);
                        break;

                    case 'clear':
                        Commands.client.clear(socket, command);
                        break;

                    default:
                        Commands.emit(socket, command, 'invalid');
                        break;
                }
            }
        });

        socket.on('disconnect', function(){
            if(!Sockets.that.is.authorized(socket)) return;
            socket.broadcast.emit('user left', Sockets.to.user(socket));
        });
    });
};
