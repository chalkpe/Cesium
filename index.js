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
