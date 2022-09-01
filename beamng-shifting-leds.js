#!/usr/bin/node

// Using some code from https://github.com/d4rk/ac_shifting_leds/blob/main/ac_shifting_leds.js and https://github.com/fuelsoft/out-gauge-cluster/blob/master/OutGaugeCluster/OutGaugeCluster.pde

const hid = require('node-hid');
const dgram = require('dgram');
const { abort, exit } = require('process');

const socket = dgram.createSocket('udp4');
const PORT = 5555;
const ADDRESS = "127.0.0.1";

var rpm;
var maxrpm = 7000;
var g29;
var firstTime = true;
var LEDFlashTime = 0;

process.stdin.on('data', data => {
  maxrpm = Number(data.toString());
  console.log("The Max RPM is now " + maxrpm);
});

console.log("You can enter the Max RPM of the car you are using at any time by typing the number of RPM in and pressing enter. The default is 7000 RPM");

socket.bind(PORT, ADDRESS);

if (g29 == undefined) {
    // Connect to the first Logitech G29.
  try {
    g29 = new hid.HID(1133, 49743);
    console.log("Connected to Logitech G29 wheel");
  } catch (e) {
    console.log("Could not open the Logitech G29 wheel. This may be due to insufficent permissions");
    console.log(e);
    exit(1);
  }
}

socket.on("message", (msg, rinfo) => {
    if (firstTime == true){
      console.log("Connected to BeamNG.Drive");
      firstTime = false;
    }
    rpm = new Float32Array(new Uint8Array([msg[16], msg[17], msg[18], msg[19]]).buffer)[0];
    updateLeds();
});

function updateLeds(){
    const rpmFrac = rpm / maxrpm;

    this.hrTime = process.hrtime();

    // Convert rpmFrac to an LED range.
    var LEDMask = 0x0;
    if (rpmFrac > 0.45) {
        LEDMask |= 0x1;
    }
    if (rpmFrac > 0.55) {
        LEDMask |= 0x2;
    }
    if (rpmFrac > 0.625) {
        LEDMask |= 0x4;
    }
    if (rpmFrac > 0.71) {
        LEDMask |= 0x8;
    }
    if (rpmFrac > 0.85) {
        LEDMask |= 0x10;
    }
    // Flash LEDs
    if (rpmFrac > 0.93){
        if (this.hrTime[0] * 1000000 + this.hrTime[1] / 1000 - LEDFlashTime > 100000){
            flashLEDs();
        }
    }
    if (LEDMask == this.previousLEDMask) {
        return;
    }
    this.previousLEDMask = LEDMask;
    g29.write([0xf8, 0x12, LEDMask, 0x00, 0x00, 0x00, 0x01])
}

function flashLEDs() {
    if (this.LEDsOn) {
      g29.write([0xf8, 0x12, 31, 0x00, 0x00, 0x00, 0x01])
    } else {
      g29.write([0xf8, 0x12, 0, 0x00, 0x00, 0x00, 0x01])
    }
    this.LEDsOn = !this.LEDsOn;
    LEDFlashTime = this.hrTime[0] * 1000000 + this.hrTime[1] / 1000;
}
