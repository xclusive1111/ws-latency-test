cmd='node server.js'
pid=$(ps aux | grep "${cmd}" | grep -v 'grep' | awk '{print $2}')
echo "Got process: $pid"

if [[ ! -z $pid ]]; then
  echo "Terminating previous process: $pid"
  kill -9 $pid
fi

echo "starting websocket server..."
nohup $cmd &
