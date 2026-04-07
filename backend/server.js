const app = require('/src/app');
const http = require('http');
const {Server} = require('socket.io')
const socketManager  = require('./src/socketManager')

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin : process.env.FRONTEND_URL || 'http://localhost:5173',
        methods :['GET','POST','PUT'],
    }
});

socketManager(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{
    console.log(`Server running on port : ${PORT}`);
})
