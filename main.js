'use strict';

var electron = require('electron')
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;

var mainWindow = null;
var settingsWindow = null;

const mainWindowSizes = [335, 300];

app.on('ready', function() {
    console.log('ready');

    mainWindow = new BrowserWindow({
        frame: false,
        height: mainWindowSizes[0],
        width: mainWindowSizes[1],
        resizable: false
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});

ipc.on('main-window:close', function () {
    app.quit();
});

var pressingPower = 0;
ipc.on('main-window:pressing-power', function (event, power) {
    console.log('pressing-power: '+power);
    pressingPower = power;
});

console.log(process.versions);
ipc.on('main-window:set-setup', function (event, data) {
    console.log(data);
    if(mainWindow && data && data.id && data.port){

        mainWindow.webContents.send('main-window:ready-indicate');


        /* UDP CLIENT*/
        var ID = data.id;
        
        var HOST = data.ip || '127.0.0.1';
        var PORT = data.port;

        var dgram = require('dgram');
        var val = 0;

        function sendState() {

            val = val+(pressingPower-0.5);
            if(val<0){
                val = 0;
            }else if(val>5){
                val = 5;
            };

            var valueToSend = Math.floor(val)
            if(mainWindow){
                mainWindow.webContents.send('main-window:sensor-value', valueToSend);
            }

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



        /* E1.31 SERVER */
        // new Buffer([0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00]);
        var e131 = require('e131');
        var dgram = require('dgram');
        // dgram.createSocket('udp4');
        // dgram.createSocket('udp4');

        
        // UNIVERSE #1
        var universe_big = new e131.Server(ID*2-1);
        // console.log(ID*2-1);
        universe_big.on('listening', function() {
            console.log('universe_big listening on port %d, universe %d', this.port, this.universe);
        });
        universe_big.on('packet', function (packet) {
          
            var sourceName = packet.getSourceName();
            var sequenceNumber = packet.getSequenceNumber();
            var universe = packet.getUniverse();
            var channelData = packet.getChannelData();
            
            var hexcolor = '#'+channelData.toString('hex', 0, 3)
            mainWindow.webContents.send('main-window:big-circle-color', hexcolor);

            console.log(hexcolor);

            /*
            console.log('source="%s", seq=%d, universe=%d, channels=%d',
                sourceName, sequenceNumber, universe, channelData.length);
            console.log('channel data = %s', channelData.toString('hex'));
            */
        });


        // UNIVERSE #2
        var universe_small = new e131.Server(ID*2);
        // console.log(ID*2);
        universe_small.on('listening', function() {
            console.log('universe_small listening on port %d, universe %d', this.port, this.universe);
        });
        universe_small.on('packet', function (packet) {
          
            var sourceName = packet.getSourceName();
            var sequenceNumber = packet.getSequenceNumber();
            var universe = packet.getUniverse();
            var channelData = packet.getChannelData();

            // console.log();
            var hexcolor = '#'+channelData.toString('hex', 0, 3)
            mainWindow.webContents.send('main-window:small-circle-color', hexcolor);
            /*
            console.log('source="%s", seq=%d, universe=%d, channels=%d',
                sourceName, sequenceNumber, universe, channelData.length);
            console.log('channel data = %s', channelData.toString('hex'));
            */
        });
        

    }
});


