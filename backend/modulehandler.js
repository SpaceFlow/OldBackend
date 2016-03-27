// CONFIG:
var loadserveradress = "http://localhost:8081";
// CODE:
var ioclient = require("socket.io-client")(loadserveradress),
    request = require("request"),
    util = require("util"),
    express = require("request"),
    poolcache = {};
var http = require('http');
var express = require('express');
var app = express();
var mytask = null,
    myid = NaN;
app = express();
var pools = {};
var server = http.createServer(app).listen();
app.set('port', server.address().port);
util.log("Trying to register...");
util.log("Client Config: Port " + app.get('port'));
ioclient.emit("register", JSON.stringify({
    port: app.get('port'),
}));
var pinging = true;
setInterval(function() {
    
    if (pinging) {
    ioclient.send(JSON.stringify({
        load: null,
        type: "ping"
    }))
        
    }
}, 1000);
util.log("Connected!");
ioclient.on("message", function(data) {
    var parseddata = JSON.parse(data);
    console.log(parseddata);
    if (parseddata.type == "fuckyou") {
        // Ping abgewiesen, Skript wahrscheinlich korrupt!
        console.log(parseddata);
        util.log("FeelsBadMan");
        process.exit(1);
    }
})
ioclient.on("task", function(data) {
    var parsedtask = JSON.parse(data)
    mytask = parsedtask.job;
    myid = parsedtask.id;
    util.log("I AM " + myid + ". MY TASK IS " + mytask);
    getPools(function() {
        // Fertig initialisiert!
        util.log("Done!");
        ioclient.on("poolupdate", function(data) {
            pools = JSON.parse(data);
            util.log("Parsed new Pool JSON");
        })
        
        
        
        
    })
});
app.get('/', function(req, res) { 
    
    
});
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
if (chunk !== null) {
    eval(chunk)
}
});
function getPools(callback) {
    request(loadserveradress, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log("Pool request successfull: " + body);
    pools = JSON.parse(body);
    callback();
    
  }
})
}
