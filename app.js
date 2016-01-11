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

var http = require('http');
var express = require('express');

var path = require('path');
var logger = require('morgan');
var favicon = require('serve-favicon');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
app.set('port', '671');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/cesium', { server: { auto_reconnect: true } });

var db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log("Connected database", db.name)
    require('./models/User').find().exec(console.log);
});

function gracefulExit(){
    mongoose.connection.close(() => {
        console.log('Mongoose default connection with DB is disconnected through app termination');
        process.exit(0);
    });
}

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);

var MongoStore = require('connect-mongo')(session);
var mongoStore = new MongoStore({ mongooseConnection: mongoose.connection });
app.use(session({ secret: 'cesium', key: 'cesium.sid', store: mongoStore, resave: true, saveUninitialized: true }));

var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

var server = http.createServer(app);
var io = require('socket.io')(server);

var passportSocketIo = require('passport.socketio');
io.use(passportSocketIo.authorize({ cookieParser: cookieParser, secret: 'cesium', key: 'cesium.sid', store: mongoStore }));

require('./app/socket')(io);
require('./app/passport')(passport);

app.use('/', require('./routes/index'));
require('./routes/auth')(app, passport);

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

server.listen(app.get('port'), function(){
    console.log('Listening on port ' + app.get('port'));
});
