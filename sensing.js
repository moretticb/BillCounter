fs = require("fs");

var btnPin = "/sys/class/gpio/gpio52/value"
var ldrPin = "/sys/bus/iio/devices/iio\:device0/in_voltage4_raw"
var lightPins = [
	"/sys/class/gpio/gpio34/value",
	"/sys/class/gpio/gpio15/value",
	"/sys/class/gpio/gpio35/value"
];

var calibData = [
	[0,0,0],
	[0,0,0]
];
var pattern = [0,0,0];
var calibState = 0;

var btnInterv = 0, intervTime=50;
var pressTime = -1, pressThresh = 2000;

var lightTime = 550;

function btnListener(){
	fs.readFile(btnPin, 'UTF-8', function(err, value){
		if(err) throw err;

		if(+value == 1 && pressTime < 0)
			pressTime = Date.now()
		else if(+value == 0 && pressTime > 0){
			if(Date.now()-pressTime > pressThresh)
				onHold();
			else
				onPress();
			pressTime = -1;
		}
	});
}


function onPress(){
	console.log("pressed / cs: "+calibState);
	clearInterval(btnInterv);

	for(var i=0;i<lightPins.length;i++){
		setTimeout(light,i*lightTime,i,"0",calibState); //common anode (0 - light)
		setTimeout(light,(i+1)*lightTime,i,"1",calibState); //common anode (1 - no light)
	}

	if(calibState==1)
		calibState++;
	else if(calibState==2)
		calibState = 0;

	setTimeout(resetListener,(lightPins.length+1)*lightTime);
}

function light(pin,value,cs){
	if(value=="1"){
		if(cs > 0){
			calibData[cs-1][pin] = readLDR();
			if(cs==calibData.length && pin==(lightPins.length-1))
				console.log("end of calibration: "+calibData[0]+"/"+calibData[1]);
		} else {
			//pattern[pin] = readLDR();
			pattern[pin] = map(readLDR(),calibData[0][pin],calibData[1][pin],0,1);
			if(pin==(lightPins.length-1))
				console.log("pattern: "+pattern);
		}
	}

	fs.writeFile(lightPins[pin],value);
}

function readLDR(){
	return fs.readFileSync(ldrPin,"UTF-8");
}

function onHold(){
	console.log("held");
	console.log("calibration");
	calibState = 1;
	resetListener();
}

function resetListener(){
	clearInterval(btnInterv);
	btnInterv = setInterval(btnListener, intervTime);
	console.log('new interval');
}

function map(value, minA, maxA, minB, maxB){
	return (value-minA)/(maxA-minA) * (maxB-minB) + minB;
}

resetListener();
