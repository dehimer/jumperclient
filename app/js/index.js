'use strict';

var ipc = require('ipc');
var $ = require('jquery');

var closeEl = $('.close');
var setupEl = $('.setup');
var indicatorEl = $('.indicator');

closeEl.bind('click', function () {
    ipc.send('main-window:close');
});



/* SET CLIENTS COUNT FORM */
const setupEls = {
    main:       setupEl,
    inputs:     setupEl.find('.setup__input'),
    inputId:    setupEl.find('.setup__input-id'),
    inputIP:    setupEl.find('.setup__input-ip'),
    inputPort:  setupEl.find('.setup__input-port'),
    submit:     setupEl.find('.setup__button'),
}
/* filter input */
setupEls.inputs.bind('keydown', function (e) {

    var inputEl = $(e.target);

    let keyCode = e.keyCode;

    if(keyCode >= 96 && keyCode <= 105){
        keyCode -= 48;
    }
    // console.log(keyCode);
    const nextChar = String.fromCharCode(keyCode);
    
    if((/[0-9]/.test(nextChar))){
    }else if (keyCode === 8){
    }else if (keyCode === 190 && inputEl.hasClass('setup__input-ip')){

    }else{
        e.preventDefault();
        return false;
    }
});

/* send */
setupEls.submit.bind('click', function () {
    const data = {
        id: setupEls.inputId.val(),
        ip: setupEls.inputIP.val(),
        port: setupEls.inputPort.val()
    }

    ipc.send('main-window:set-setup', data);
});



ipc.send('main-window:ready');


var indicatorCircleEl = indicatorEl.find('.indicator__circle');
ipc.on('main-window:update-color', function (color){
    indicatorCircleEl.css('background-color');
});

ipc.on('main-window:ready-indicate', function (color){
    setupEl.addClass('setup--disabled');
    indicatorEl.removeClass('indicator--disabled');
});