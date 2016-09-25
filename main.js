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

var pressingPower = 0;
ipc.on('main-window:pressing-power', function (event, power) {
    console.log('pressing-power: '+power);
    pressingPower = power;
});

ipc.on('main-window:set-setup', function (event, data) {
    console.log(data);
    if(mainWindow && data && data.id && data.port){

        mainWindow.webContents.send('main-window:ready-indicate');

        var ID = data.id;
        var HOST = data.ip || '127.0.0.1';
        var PORT = data.port;

        var dgram = require('dgram');
        var val = 0;

        function sendState() {

            val = val+(Math.random()*2*pressingPower-0.5);
            if(val<0){
                val = 0;
            }else if(val>5){
                val = 5;
            };

            var valueToSend = Math.floor(val)
            mainWindow.webContents.send('main-window:sensor-value', valueToSend);
            var message = new Buffer(ID+' '+valueToSend);

            var client = dgram.createSocket('udp4');
            client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
                if (err) throw err;
                // console.log(message)
                // console.log('UDP message sent to ' + HOST +':'+ PORT);
                client.close();

                setTimeout(sendState, 100);
            });    
        }

        sendState();
    }
});