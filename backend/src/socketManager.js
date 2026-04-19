const roomManager = require('./roomManager');
let ioInstance=null;
function setIo(io){
    ioInstance=io;
    gameManager.setIoForGames(io);
}
function getIo(){
    return ioInstance;
}
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected', socket.id);
        
        socket.on('join-room', ({ roomId, username }, callback)=>{
            const {roomId,playerName}=data;
            if(!roomId) return callback({ error: 'roomId required'});

            const prevRooms = Array.from(socket.rooms).filter(r => r != socket.id);
            prevRooms.forEach(room => socket.leave(room));
            
            socket.join(roomId);
            let game = gameManager.getGame(roomId);
            if(!game){
                game=gameManager.createGame(roomId,socket.id);
            }
            const playerNameToUse=playerName || `Player_${Math.floor(Math.random()*10000)}`;
            game.addPlayer(socket.id,playerNameToUse);
            callback({
                success:true,
                gameState: game.state,
                players: game.getPlayerNames(),
                currentDrawerId:game.currentDrawerId,
                roundNumber:game.roundNumber,
                wordHint:(game.state === 'drawing' && game.currentWord)?
                game.currentWord.split('').map(c=> /[a-zA-Z]/.test(c)?'_':c).join(' '):null
            });
            socket.on('draw',({roomId,stroke})=>{
                const game=gameManager.getGame(roomId);
                if(!game)return;
                if(game.state === 'drawing' && game.currentDrawerId === socketId){
                    socket.to(roomId).emit('draw',stroke);
                }
            });
            socket.on('undo',({roomId})=>{
                const game=gameManager.getGame(roomId);
                if(game && game.state === 'drawing' && game.currentDrawerId===socket.id){
                    socket.to(roomId).emit('undo-stroke');
                }
            });

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
        socket.on('game:start',({roomId})=>{
            const game = gameManager.getGame(roomId);
            if(game && game.hostId === socket.id && game.state === 'waiting'){
                game.startGame();
            }else{
                socket.emit('error',{message: 'Not authorized or game already started'});
            }
        });
        socket.on('game:select_word',({roomId,word})=>{
            const game=gameManager.getGame(roomId);
            if(game && game.state === 'word_selection' && game.currentDrawerId === socket.id){
                if(game.wordOptions.includes(word)){
                    game.selectWprd(word);
                }else{
                    socket.emit('error',{message: 'Invalid word selection'});
                }
            }
        });
        socket.on('game:guess',({roomId,guess})=>{
            const game=gameManager.getGame(roomId);
            if(!game) return;
            const result = game.handleGuess(socket.id,guess);
            if(!result.success){
                socket.emit('game:guess_failed',{reason:result.reason});
            }
        });
        socket.on('chat-message',({roomId,username,message,emoji})=>{
            const game=gameManager.getGame(roomId);
            if(game && game.state === 'drawing'){

            }
            let fullMessage=message;
            if(emoji) fullMessage=emoji+(message? ' '+ message: '');
            socket.to(roomId).emit('chat-message',{username,message:fullMessage,timestamp:Date.now()});
        });


        socket.on('draw', ({roomId, stroke})=>{
            roomManager.addStroke(roomId, stroke);
            socket.to(roomId).emit('draw', stroke);
        });

        socket.on('cursor-move', ({roomId, cursorData}) => {
            socket.to(roomId).emit('cursor-move', { socketId: socket.id, ...cursorData });
        });

        socket.on('clear-canvas', ({roomId})=>{
            const game=gameManager.getGame(roomId);

            if(game && game.state === 'drawing' && game.currentDrawerId === socket.id){
            socket.to(roomId).emit('clear-canvas');
            }
        });


        socket.on('disconnect', ()=>{
            const rooms=Array.from(socket.rooms);
            for(const roomId of rooms){
                if(roomId !== socket.id){
                    const game=gameManager.getGame(roomId);
                    if(game){
                        game.removePlayer(socket.id);
                        socket.to(roomId).emit('player_left',{id:socket.id,players:game.getPlayerNames()});
                        if(game.players.size===0){
                            gameManager.deleteGame(roomId);
                        }else if(game.currentDrawerId === socket.id && game.state==='drawing'){
                            game.endRound();
                        }
                    }
                    roomManager.removeUser(roomId,socket.id);
                }
            }
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
module.exports.getIo=getIo;