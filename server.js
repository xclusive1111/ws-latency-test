const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const percentile = require("percentile");
const url = require('url');
const index = fs.readFileSync(__dirname + '/index.html');


console.log('Creating HTTP server...');

const wss = new WebSocket.Server({noServer: true});
wss.on('connection', (ws, req) => {
    console.log("New websocket connection  %s", req.socket.remoteAddress);
    const interval = +(req?.query?.msg_interval || 100);
    const statsInterval = +(req?.query?.stats_interval || 1000);
    const latencies = [];
    const maxLatencyCnt = +(req?.query?.max_sample_cnt || 1000);

    // Add latency into the collection
    // Remove old latency if neccessary
    function addLatency(latency) {
        if (latencies.length === maxLatencyCnt) {
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
            ws.send(['echo', uuidv4() + uuidv4() + uuidv4(), currentLatency, Date.now()].join('|'));
        }, interval);
    });

    // Send an initiate message, client will echo back upon receiving this message
    ws.send(['echo', uuidv4(), 0, Date.now()].join('|'));

    // Calculate latency stats every 1 second
    setInterval(() => {
        // Only calculate if at least 200 data points are collected
        if (latencies.length >= 200) {
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
    }, statsInterval);
});

const server = http.createServer((req, res) => {
    console.log("%s %s", req.method, req.url);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

server.on('upgrade', function upgrade(request, socket, head) {
    const parse = url.parse(request.url, true);
    const pathname = parse.pathname;

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            request.query = parse.query;
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

const port = 8000;
server.listen(port);
console.log('HTTP server listening on port ' + port);
