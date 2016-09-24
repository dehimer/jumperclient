'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');

var mainWindow = null;
var settingsWindow = null;

const mainWindowSizes = [335,300];

app.on('ready', function() {
    console.log('ready');

    mainWindow = new BrowserWindow({
        frame: false,
        height: mainWindowSizes[0],
        width: mainWindowSizes[1],
        resizable: false
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
    
});

ipc.on('main-window:close', function () {
    app.quit();
});


ipc.on('main-window:set-setup', function (event, data) {
    console.log(data);
    if(mainWindow && data && data.id && data.port){

        mainWindow.webContents.send('main-window:ready-indicate');

        var ID = data.id;
        var HOST = data.ip || '127.0.0.1';
        var PORT = data.port;

        var dgram = require('dgram');

        function sendState() {

            var sensorVal = Math.floor(Math.random()*5);

            var message = new Buffer(ID+' '+sensorVal);

            var client = dgram.createSocket('udp4');
            client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
                if (err) throw err;
                console.log(message)
                // console.log('UDP message sent to ' + HOST +':'+ PORT);
                client.close();

                setTimeout(sendState, 100);
            });    
        }

        sendState();
    }
});
