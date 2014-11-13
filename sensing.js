/*****************************************/
/*****************************************/
/**                                     **/
/**       IoT Bill Counter project      **/
/**           Toradex + Azure           **/
/**                                     **/
/**  Developed by Caio Benatti Moretti  **/
/**      http://www.moretticb.com/      **/
/**          caiodba@gmail.com          **/
/**                                     **/
/*****************************************/
/*****************************************/


fs = require("fs");
var https = require("https");

var btnPin = "/sys/class/gpio/gpio52/value"
var ldrPin = "/sys/bus/iio/devices/iio\:device0/in_voltage4_raw"
var lightPins = [
	"/sys/class/gpio/gpio34/value", //red pin
	"/sys/class/gpio/gpio15/value", //green pin
	"/sys/class/gpio/gpio35/value"  //blue pin
];

var calibData = [
	[0,0,0], //lowest light intensity detected from RGB values (showing black color)
	[0,0,0]  //highest light intensity detected from RGB values (showing white color)
];
var pattern = [0,0,0];
var calibState = 0;

var btnInterv = 0, intervTime=50;
var pressTime = -1, pressThresh = 2000;

var lightTime = 550;

var isBusy = -1; //for async purposes

function btnListener(){
	fs.readFile(btnPin, 'UTF-8', function(err, value){
		if(err) throw err;

		if(isBusy != 1){
			if(isBusy<0){
				console.log("\n\n\nPRESS for detection or HOLD for calibration...");
				isBusy=0;
			}
			if(+value == 1 && pressTime < 0)
				pressTime = Date.now()
			else if(+value == 0 && pressTime > 0){
				if(Date.now()-pressTime > pressThresh)
					onHold();
				else
					onPress();
				pressTime = -1;
			}
		}
	});
}


function onPress(){
	//console.log("pressed / cs: "+calibState);
	if(calibState>0)
		console.log("Calibrating "+(calibState==1?"black":"white")+" color...");
	else
		console.log("Detecting...");
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
			if(cs==calibData.length && pin==(lightPins.length-1)){
				//console.log("end of calibration: "+calibData[0]+"/"+calibData[1]);
				console.log("End of calibration.");
				isBusy = -1;
			}
		} else {
			//pattern[pin] = readLDR();
			pattern[pin] = map(readLDR(),calibData[0][pin],calibData[1][pin],0,1);
			if(pin==(lightPins.length-1)){
				isBusy = 1;
				console.log("pattern: "+pattern);
				detect(pattern[0],pattern[1],pattern[2]);
			}
		}
	}

	fs.writeFile(lightPins[pin],value);
}

function readLDR(){
	return fs.readFileSync(ldrPin,"UTF-8");
}

function onHold(){
	//console.log("held");
	console.log("Calibration: show BLACK and WHITE colors...");
	calibState = 1;
	resetListener();
}

function resetListener(){
	clearInterval(btnInterv);
	btnInterv = setInterval(btnListener, intervTime);
	//console.log('new interval');
}

function map(value, minA, maxA, minB, maxB){
	return (value-minA)/(maxA-minA) * (maxB-minB) + minB;
}

function detect(r,g,b){
	var apiKey = 'eEybQHrqy7l+yfgNhUG5cEslqVZSz05robp+WfTXqjzojBqRmR64fnUnmCXyfZ7de01ccddh+xyo+kHOW2/r5w==';
	var host = "ussouthcentral.services.azureml.net";
	var path = "/workspaces/8c128539c26848f6b3c30fe6532a906e/services/896cbc43ae17498a8683b13b20c31ace/execute?api-version=2.0&details=true";

	//var requestJSON = '{"Inputs":{"input1":{"ColumnNames":["R","G","B"],"Values":[["'+String(r)+'","'+String(g)+'","'+String(b)+'"]]}},"GlobalParameters":{}}';
	var requestJSON = '{"Inputs":{"input1":{"ColumnNames":["R","G","B"],"Values":[["'+String(r)+'","'+String(g)+'","'+String(b)+'"]]}}}';
	var headers = {'Content-Type':'application/json', 'Authorization':'Bearer ' + apiKey};

	var requestOptions = {host: host,port: 443,path: path,method: "POST",headers: headers}; //port 443 for https
	var request = https.request(requestOptions, function(response){
		if(response.statusCode != 200)
			console.error("response error");

		response.on('data',function(data){
			console.log(getColorName(data.toString()));
			isBusy = -1;
		});
	});
	request.write(requestJSON);
	request.end();

	request.on('error',function(error){
		console.error("request error: "+error);
	});
	
}

function getColorName(responseJSON){
	var data = JSON.parse(responseJSON);
	return data.Results.output1.value.Values[0][0];
}

resetListener();
