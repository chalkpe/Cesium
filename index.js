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

var path = require('path');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
    socket.on('login', function(data){
        socket.username = data.username;
        io.emit('message join', socket.username);
    });

    socket.on('message', function(data){
        io.emit('message', {
            username: socket.username,
            message: data
        });
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('message left', socket.username);
    });
});

app.use(require('morgan')('dev'));
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(671, function(){
    console.log('Listening on port 671');
});
