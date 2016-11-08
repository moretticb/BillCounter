var Protocol = require('azure-iot-device-http').Http;
var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

var connectionString = "HostName=bcounter.azure-devices.net;DeviceId=d1;SharedAccessKey=Xf+lwFN6j86SImtOA60N5EjXHxUD+w4Dp63EalE38y8=";
var client = Client.fromConnectionString(connectionString,Protocol);

var data = {
        billValue: 50,
        tstamp: null
};

function sendData(){
        data.tstamp = new Date();
        var dataJSON = JSON.stringify(data);
        var msg = new Message(dataJSON);

        client.sendEvent(msg, function msgSent(err){
                if(err) throw err;
                console.log("Msg sent: "+dataJSON);
        });
}

sendData();
