# Websocket latency test
* Ping a websocket server every 50ms and aggregate the result.
* Stats is calculated based on the last 1000 pings

## Run

Start a websocket server

```
$ npm install
$ ./start.sh
```

Open browser @ port 8000.

Example output:
```
Latency statistic:
now: 36ms
min: 36ms
max: 150ms
75th percentile: 38ms
95th percentile: 40ms
99th percentile: 46ms
Updated at: Thu May 20 2021 11:48:03 GMT+0700 (Indochina Time)
```
