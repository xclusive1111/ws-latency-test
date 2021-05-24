# Websocket latency test
* Ping a websocket server every 100ms and aggregate the result.
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
now: 1ms
min: 0ms
max: 51ms
75th percentile: 1ms
95th percentile: 2ms
99th percentile: 51ms
Updated at: Mon May 24 2021 17:20:08 GMT+0700 (Indochina Time)

Connection status:
Current status: connected
disconnected @ Mon May 24 2021 17:20:08 GMT+0700 (Indochina Time)
disconnected @ Mon May 24 2021 17:25:17 GMT+0700 (Indochina Time)
```
