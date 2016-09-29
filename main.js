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


var SERVER_HOST;

/* UDP CLIENT FOR SERVER LIGHTING */
var PORT = 5567;
var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.on('listening', function () {
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
    client.setBroadcast(true);
});

client.on('message', function (message, rinfo) {
    SERVER_HOST = rinfo.address;
    console.log('Message from: ' + rinfo.address + ':' + rinfo.port +' - ' + message);

});


client.bind(PORT);

console.log(process.versions);
ipc.on('main-window:set-setup', function (event, data) {
    console.log(data);
    if(mainWindow && data && data.id){

        mainWindow.webContents.send('main-window:ready-indicate');


        /* UDP CLIENT FOR COLORS */
        var ID = data.id;

        var SERVER_PORT = 3000;

        var dgram = require('dgram');
        var val = 0;


        var curTs;
        var delay = 100;


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
            curTs = +(new Date());
            if(SERVER_HOST){
                var client = dgram.createSocket('udp4');
                client.send(message, 0, message.length, SERVER_PORT, SERVER_HOST, function(err, bytes) {
                    if (err) throw err;
                    // console.log(message)
                    console.log('UDP message sent to ' + SERVER_PORT +':'+ SERVER_HOST);
                    client.close();

                    setTimeout(sendState, delay - (+(new Date())-curTs) );
                });    
            }else{
                setTimeout(sendState, delay - (+(new Date())-curTs));
            }
        }

        sendState();



        /* E1.31 SERVER */
        var e131 = require('e131');
        var dgram = require('dgram');

        
        // UNIVERSES
        var universes = new e131.Server([1, 2]);//
        // console.log(ID*2-1);
        universes.on('listening', function() {
            console.log(this.universes);
            console.log('universes listening on port %d, universes %s', this.port, this.universes.join(','));
        });
        universes.on('packet', function (packet) {
          
            var sourceName = packet.getSourceName();
            var sequenceNumber = packet.getSequenceNumber();
            var universe = packet.getUniverse();
            var channelData = packet.getChannelData();
            var hexcolor = '#'+channelData.toString('hex', 0, 3)
            mainWindow && mainWindow.webContents.send('main-window:big-circle-color', hexcolor);

            console.log(universe+' : '+hexcolor);
            /*
            console.log('source="%s", seq=%d, universe=%d, channels=%d',
                sourceName, sequenceNumber, universe, channelData.length);
            console.log('channel data = %s', channelData.toString('hex'));
            */
        });
        

    }
});