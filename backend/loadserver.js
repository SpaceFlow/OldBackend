// Das hier ist das wichtigste Script im Netzwerk!
// Wenn dieses nicht mit genügend Integrität und stabilität Arbeitet rasselt das komplette System weg!
// Für weitere Informationen hierzu sehe man im Battleplan nach
var app = require('http').createServer(handler)
var iosocket = require('socket.io')(app);
var fs = require('fs');

app.listen(8081);
Array.prototype.unset = function(value) {
    if(this.indexOf(value) != -1) { // Make sure the value exists
        this.splice(this.indexOf(value), 1);
    }   
}
function handler (req, res) {
    res.writeHead(200);
    res.end(JSON.stringify(pools));
  
}
var fs = require("fs"),
    util = require("util"),
    pools = {
        "restdatain": [],
        "restdataout": [],
        "socketiostreamingout": [],
        "webserver": [],
        "databasemanaging": [],
        "undefined": []
        
    },
    clientcount = 0,
    nodetimer = {},
    pingcache = {};


util.log("Start listening");
iosocket.on("connection", function(socket) {
    var thisid = undefined,
        timeout = false,
        cleared = false;
    socket.on("register", function(data) {
        // Node versucht sich zu registrieren!
        var clientoptions = JSON.parse(data);
        clientcount++;
        thisid = clientcount;
        var answer = {
            id: thisid,
            job: undefined
        }
        pools[answer.job].push(socket.handshake.address.replace("::ffff:", "")  + ":" + clientoptions.port);
        iosocket.emit("poolupdate", JSON.stringify(pools));
        pingcache[thisid] = true;
        socket.emit("task", JSON.stringify(answer))
        // Pingtimer starten um aktive Clients zu finden
        
        nodetimer[thisid] = setInterval(function() {
            if (pingcache[thisid]) {
                // Client alive! \o/
                util.log("Got ping from Client " + thisid);
                if (!timeout) {
                pingcache[thisid] = false;
            
                } else {
                    if (!cleared) {
                    // Client abschießen!
                    socket.send(JSON.stringify({
                        type: "fuckyou",
                        reason: "ur to slow"
                    }));
                    socket.disconnect();
                    util.log("Socket killed");
                    clearInterval(nodetimer[thisid]);
                    cleared = true;
                    }
                }
            } else {
                // Er ist tot, Jim. Entfernen wir ihn aus der Datenbank!
                util.log("Ping Timeout from Node " + thisid);
                timeout = true;
                pools[answer.job].unset(socket.handshake.address.replace("::ffff:", "")  + ":" + clientoptions.port);
                iosocket.emit("poolupdate", JSON.stringify(pools));
                setTimeout(function() {
                    if (!cleared) {
                        socket.disconnect();
                        util.log("Socket killed");
                        clearInterval(nodetimer[thisid]);
                        cleared = true;
                    }
                }, 10000)
            }
            
        }, 6000);
    
        
    });
    // Auf Pings warten, wenn welche ankommen den Clientstatus fürs Loadbalancing parsen und den Pingcache für den Timer setzen
    socket.on("message", function(data) {
        var parseddata = JSON.parse(data);
        if (parseddata.type == "ping") {
            var clientstatus = JSON.parse(data);
            pingcache[thisid] = true;
        
        } else if (parseddata.type == "requestpool") {
            socket.send(JSON.stringify({
                type: "pool",
                poolname: parseddata.poolname,
                adresses: pools[parseddata.poolname]
            }))
        }
        
    })
});
