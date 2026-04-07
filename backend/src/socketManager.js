const roomManager = require('./roomManager');

module.exports = (io)=>{
    io.on('connection',(socket.id));
    console.log('User connected', socket.id);
    socket.on('join-room', (roomId,callback)=>{
        const prevRooms = Array.from(socket.rooms).filler(r=> r !=socket.id);
        prevRooms.forEach(room => socket.leave(room));
        socket.join(roomId);
        roomManager.addUser(roomId, socket.id);
        const strokes = roomManager.getRoomStrokes(roomId);
        callback({strokes});

    });

    socket.on('draw',({roomId,stroke})=>{
        roomManager.addStroke(roomId,stroke);
        socket.to(roomId).emit('draw', stroke);

    });
    socket.on('undo',({roomId})=>{
        const removed = roomManager.undoStroke(roomId);
        if (removed) socket.to(roomId).emit('undo-stroke');
    });
    socket.on('clear-canvas',({roomId})=>{
        roomManager.clearRoomStrokes(roomId);
        socket.to(roomId).emit('clear-canvas');
    });

    socket.on('chat-message',({roomId,username,message,emoji})=>{
        const fullMsg = emoji ? `${message} ${emoji}`:message;
        socket.to(roomId).emit('chat-message',{username,message: fullMsg, timestamp:Date.now()});

    });

    socket.on('disconnect',()=>{
        roomManager.removeUserFromAllRooms(socket.id);
        console.log('User disconnected:',socket.id);
    });
}