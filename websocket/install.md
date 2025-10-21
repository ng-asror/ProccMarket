```
npm install -g pm2
pm2 start socket-server.js --name "socketio-server"
pm2 save
pm2 startup
```