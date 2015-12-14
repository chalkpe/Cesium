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

function getSockets(room, namespace, filter){
    var sockets = [];
    var namespace = io.of(namespace || '/');

    if(namespace) for(var id in namespace.connected){
        if(!room || namespace.connected[id].rooms.indexOf(room) >= 0){
            var socket = namespace.connected[id];
            if(!filter || filter.call(null, socket)) sockets.push(socket);
        }
    }
    return sockets;
}

function getOnlineUsers(){
    return getSockets(null, null, function(socket){
        return socket.username !== null;
    }).map(function(socket){
        return { username: socket.username, address: socket.address };
    });
}

function findOnlineUser(username){
    return getOnlineUsers().filter(function(user){
        return user.username === username;
    });
}

function sendOnlineUsers(socket){
    socket.emit('command', { what: 'online', request: (socket.lastCommand && socket.lastCommand.raw) || null, response: getOnlineUsers() });
}

io.on('connection', function(socket){
    socket.lastTime = 0;
    socket.username = null;

    socket.on('login', function(data){
        if(data.username.trim().length === 0 || data.username === "undefined"){
            socket.emit('login', { success: false });
            return;
        }

        socket.username = data.username.trim();
        socket.address = socket.request.connection.remoteAddress;

        if(findOnlineUser(socket.username).length > 1) socket.username += '_';

        socket.emit('login', {
            success: true,
            username: socket.username, address: socket.address
        });
        sendOnlineUsers(socket);

        if(socket.username !== null) io.emit('message join', {
            username: socket.username, address: socket.address
        });
    });

    socket.on('message', function(data){
        if(!socket.username) return;
        if(data.trim().length === 0) return;

        var now = Date.now();
        if(Math.abs(now - socket.lastTime) < 750) return;
        socket.lastTime = now;

        if(data.startsWith('/')){
            var command = data.split(' ');
            socket.lastCommand = { raw: data, command: command };

            switch(command[0].toLowerCase()){
                case '/online':
                    sendOnlineUsers(socket);
                    break;
            }
        }else io.emit('message', {
            username: socket.username, address: socket.address,
            message: data
        });
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('message left', {
            username: socket.username, address: socket.address
        });
    });
});

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});
