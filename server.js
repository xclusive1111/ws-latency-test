const http = require('http');
const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');
const percentile = require("percentile");
const url = require('url');


console.log('Creating HTTP server...');
const script = '\
    <body>\
      <div><b>Connection status:</b></div>\
      <div id="status">Status:</div>\
      <br>\
      <div><b>Latency statistic:</b></div>\
      <div id="latency">Logs:</div>\
    </body>\
    <script>\
      window.onload = function() {\
        const ws = new WebSocket("ws://" + location.hostname + ":8000/ws");\
        function logStatus(text) {\
          document.getElementById("status").innerHTML = text;\
        }\
        function logLatency(text) {\
          document.getElementById("latency").innerHTML = text;\
        }\
        logStatus("connecting to websocket server @" + ws.url);\
        ws.onopen = function() {\
          logStatus("connected");\
        };\
        ws.onclose = function(e) {\
          logStatus("disconnected @ " + new Date());\
        };\
        ws.onmessage = function(e) {\
          const parts = e.data.split("|");\
          const cmd = parts[0];\
          if (cmd === "echo") {\
            ws.send(e.data);\
            return;\
          }\
          if (cmd === "stats") {\
            const data = [\
              "now: " + parts[6] + "ms",\
              "min: " + parts[1] + "ms",\
              "max: " + parts[2] + "ms",\
              "75th percentile: " + parts[3] + "ms",\
              "95th percentile: " + parts[4] + "ms",\
              "99th percentile: " + parts[5] + "ms",\
              "Updated at: " + new Date().toString(),\
            ].join("<br>");\
            logLatency(data);\
          }\
        };\
      };\
    </script>\
  ';

const wss = new WebSocket.Server({noServer: true});
wss.on('connection', (ws, req) => {
    console.log("New websocket connection  %s", req.socket.remoteAddress);
    const latencies = [];
    const maxLatencyLength = 1000;

    function addLatency(latency) {
        if (latencies.length === maxLatencyLength) {
            latencies.shift();
        }

        latencies.push(latency);
    }

    let currentLatency;
    ws.on('message', (msg) => {
        const parts = msg.split('|');
        currentLatency = Date.now() - (+parts[3]);
        addLatency(currentLatency);

        setTimeout(() => {
            ws.send(['echo', uuidv4(), currentLatency, Date.now()].join('|'));
        }, 50);
    });

    // Send an initiate message, client will echo back upon receiving this message
    ws.send(['echo', uuidv4(), 0, Date.now()].join('|'));

    // Calculate latency stats every 1 second
    setInterval(() => {
        if (currentLatency) {
            const data = ['stats'];
            const result = percentile([75, 95, 99], latencies);

            data.push(Math.min(...latencies));
            data.push(Math.max(...latencies));
            data.push(result[0]);
            data.push(result[1]);
            data.push(result[2]);
            data.push(currentLatency);

            ws.send(data.join('|'));
        }
    }, 1000);
});

const server = http.createServer((req, res) => {
    console.log("%s %s", req.method, req.url);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(script);
});

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(8000);
console.log('HTTP server listening on port 8000');
