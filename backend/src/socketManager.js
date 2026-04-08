const roomManager = require('./roomManager');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected', socket.id);
        
        socket.on('join-room', ({ roomId, username }, callback)=>{
            const prevRooms = Array.from(socket.rooms).filter(r => r != socket.id);
            prevRooms.forEach(room => socket.leave(room));
            
            socket.join(roomId);

            let finalName = username;
            const existingUsers = roomManager.getRoomUsers(roomId);
            if (existingUsers.includes(username)) {
                let suffix = 1;
                while (existingUsers.includes(`${username} (${suffix})`)) {
                    suffix++;
                }
                finalName = `${username} (${suffix})`;
            }

            roomManager.addUser(roomId, socket.id, finalName);
            
            io.to(roomId).emit('update-users', roomManager.getRoomUsers(roomId));
            socket.to(roomId).emit('user-notification', `${finalName} has joined the room.`);
            
            const strokes = roomManager.getRoomStrokes(roomId);
            if (callback) callback({ strokes, assignedName: finalName });
        });

        socket.on('draw', ({roomId, stroke})=>{
            roomManager.addStroke(roomId, stroke);
            socket.to(roomId).emit('draw', stroke);
        });

        socket.on('cursor-move', ({roomId, cursorData}) => {
            socket.to(roomId).emit('cursor-move', { socketId: socket.id, ...cursorData });
        });

        socket.on('clear-canvas', ({roomId})=>{
            roomManager.clearRoomStrokes(roomId);
            socket.to(roomId).emit('clear-canvas');
        });

        socket.on('disconnect', ()=>{
            const leftRooms = roomManager.removeUserFromAllRooms(socket.id);
            leftRooms.forEach(({ roomId, username }) => {
                io.to(roomId).emit('update-users', roomManager.getRoomUsers(roomId));
                io.to(roomId).emit('user-notification', `${username} has left the room.`);
            });
            io.emit('user-disconnected', socket.id);
            console.log('User disconnected:', socket.id);
        });
    });
}