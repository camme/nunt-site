/************************************
 * nunt site 2.0
 * Create by camilo tapia 
 ************************************/

// the event framework
var nunt = require('nunt');
var settings = require('./settings');
var everyauth = require('everyauth');
var config = settings.config;
var path = require("path");
var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

var ts  = require('./lib/twitter-stats.js');

// init nunt
nunt.init({
    server: server,
    load: [__dirname + "/logic"],
    fakeSocket: true,
    silent: true
});

app.configure(function(){
    app.use(nunt.middleware());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret:'whodunnit' }));
    app.use(
        require('stylus').middleware({
            force: false,
            compress: true,
            src: __dirname + "/public",
            dest: __dirname + "/public"
        })
    );
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
    app.use(everyauth.middleware());
});

// connect the socket server
server.listen(config.server.port);

nunt.on("client.mouse", function(e) {
    nunt.send("client.mouse.move", { clientId: e.sessionId.substring(0, 10), mouse: {x: e.x, y: e.y} } );
});

nunt.on(nunt.CONNECTED, function(e) {
    nunt.send("client.connected", { clientId: e.sessionId.substring(0, 10)});
});



