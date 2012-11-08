/************************************
 * nunt site 2.0
 * Create by camilo tapia 
 ************************************/

// the event framework
var nunt = require('nunt');
var config = require("./config").config;
var path = require("path");
var fs = require('fs');
var express = require('express');
var app = express.createServer();

// init nunt
nunt.init({
    server: app,
    load: [__dirname + "/logic"],
    fakeServer: true,
    silent: true
});


app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(nunt.middleware());
    app.use(express.session({ secret:'whodunnit' }));
    app.use(
        require('stylus').middleware({
            force: false,
            compress: true,
            src: __dirname + "/public",
            dest: __dirname + "/public"
        })
    );
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

// connect the socket server
app.listen(config.server.port);

nunt.on("client.mouse", function(e) {
    nunt.send("client.mouse.move", { clientId: e.sessionId.substring(0, 10), mouse: {x: e.x, y: e.y} } );
});

nunt.on(nunt.CONNECTED, function(e) {
    nunt.send("client.connected", { clientId: e.sessionId.substring(0, 10)});
});



