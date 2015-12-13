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

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});
