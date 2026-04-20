const roomManager = require('./roomManager');
const gameManager = require('./gameManager'); // Added missing import

let ioInstance = null;

function setIo(io) {
    ioInstance = io;
    gameManager.setIoForGames(io);
}

function getIo() {
    return ioInstance;
}

module.exports = (io) => {
    setIo(io);
    io.on('connection', (socket) => {
        console.log('User connected', socket.id);

        socket.on('find-world-room', (callback) => {
            let roomId = roomManager.findAvailablePublicRoom();
            if(!roomId) {
                // Generate a new public room
                roomId = `world-${Math.floor(Math.random() * 100000)}`;
                roomManager.createRoom(roomId, 'public');
            }
            if(callback) callback({ roomId });
        });

        socket.on('join-room', ({ roomId, username, roomType }, callback) => {
            if (!roomId) return callback ? callback({ error: 'roomId required' }) : null;

            // Leave previous rooms
            const prevRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
            prevRooms.forEach(room => socket.leave(room));

            // Check if room is full
            const existingUsers = roomManager.getRoomUsers(roomId);
            const isAlreadyInRoom = existingUsers.includes(username); // simplified check or use socket map later
            if (!isAlreadyInRoom && existingUsers.length >= 5) {
                if (callback) callback({ error: 'Room is full! Maximum 5 players allowed.' });
                return;
            }

            // Ensure room exists with the correct type if newly created
            const room = roomManager.getRoom(roomId);
            if (!room) {
                roomManager.createRoom(roomId, roomType || 'private');
            }

            socket.join(roomId);

            // -- Game Management --
            let game = gameManager.getGame(roomId);
            if (!game) {
                game = gameManager.createGame(roomId, socket.id);
            }
            
            const playerNameToUse = username || `Player_${Math.floor(Math.random() * 10000)}`;
            game.addPlayer(socket.id, playerNameToUse);

            // -- Room Management (Syncing Strokes) --
            let finalName = playerNameToUse;
            
            // Avoid duplicate names in basic room management
            if (existingUsers.includes(playerNameToUse)) {
                let suffix = 1;
                while (existingUsers.includes(`${playerNameToUse} (${suffix})`)) {
                    suffix++;
                }
                finalName = `${playerNameToUse} (${suffix})`;
            }

            roomManager.addUser(roomId, socket.id, finalName);

            // Notify others
            io.to(roomId).emit('update-users', roomManager.getRoomUsers(roomId));
            io.to(roomId).emit('player_joined', { players: game.getPlayerNames() });
            socket.to(roomId).emit('user-notification', `${finalName} has joined the room.`);
            
            // Send back initial state
            const strokes = roomManager.getRoomStrokes(roomId);
            if (callback) {
                callback({
                    success: true,
                    assignedName: finalName,
                    strokes: strokes,
                    gameState: game.state,
                    players: game.getPlayerNames(),
                    currentDrawerId: game.currentDrawerId,
                    roundNumber: game.roundNumber,
                    wordHint: (game.state === 'drawing' && game.currentWord) ?
                        game.currentWord.split('').map(c => /[a-zA-Z]/.test(c) ? '_' : c).join(' ') : null
                });
            }

            // Auto-start: if 2+ players and game is still waiting, start immediately
            if (game.state === 'waiting' && game.players.size >= 2) {
                setTimeout(() => {
                    if (game.state === 'waiting' && game.players.size >= 2) {
                        game.startGame();
                    }
                }, 1500); // Short delay so everyone's UI is ready
            }
        });

        // Moved listeners outside of join-room to prevent multiple registrations
        socket.on('draw', ({ roomId, stroke }) => {
            const game = gameManager.getGame(roomId);
            
            // Link stroke to author
            stroke.author = socket.id;
            // Persist for room sync
            roomManager.addStroke(roomId, stroke);
            
            // If in a game, check if the sender is the drawer
            if (game && game.state === 'drawing') {
                if (game.currentDrawerId === socket.id) {
                    socket.to(roomId).emit('draw', stroke);
                }
            } else {
                // Free draw if no game is active
                socket.to(roomId).emit('draw', stroke);
            }
        });

        socket.on('undo-path', ({ roomId, pathId }) => {
            const game = gameManager.getGame(roomId);
            roomManager.deletePath(roomId, pathId);
            
            if (game && game.state === 'drawing') {
                if (game.currentDrawerId === socket.id) {
                    socket.to(roomId).emit('undo-path', pathId);
                }
            } else {
                socket.to(roomId).emit('undo-path', pathId);
            }
        });

        socket.on('clear-canvas', ({ roomId }) => {
            const game = gameManager.getGame(roomId);
            
            if (game && game.state === 'drawing') {
                if (game.currentDrawerId === socket.id) {
                    roomManager.clearRoomStrokes(roomId);
                    socket.to(roomId).emit('clear-canvas');
                }
            } else {
                roomManager.clearRoomStrokes(roomId);
                socket.to(roomId).emit('clear-canvas');
            }
        });

        socket.on('game:start', ({ roomId }) => {
            const game = gameManager.getGame(roomId);
            if (game && game.players.size > 1 && game.state === 'waiting') {
                game.startGame();
            } else if (game && game.players.size <= 1) {
                socket.emit('error', { message: 'Not enough players to start the game' });
            } else {
                socket.emit('error', { message: 'Game has already started or cannot be found' });
            }
        });

        socket.on('game:select_word', ({ roomId, word }) => {
            const game = gameManager.getGame(roomId);
            if (game && game.state === 'word_selection' && game.currentDrawerId === socket.id) {
                if (game.wordOptions.includes(word)) {
                    game.selectWord(word); // Fixed typo from selectWprd
                } else {
                    socket.emit('error', { message: 'Invalid word selection' });
                }
            }
        });

        socket.on('game:guess', ({ roomId, guess }) => {
            const game = gameManager.getGame(roomId);
            if (!game) return;
            
            const player = game.players.get(socket.id);
            const playerName = player ? player.name : 'Unknown';
            
            const result = game.handleGuess(socket.id, guess);
            if (result.success) {
                // Broadcast correct guess notification
                io.to(roomId).emit('chat-message', {
                    username: '🎉 System',
                    message: `${playerName} guessed the word! (+${result.points} pts)`,
                    timestamp: Date.now(),
                    type: 'correct'
                });
            } else {
                // Broadcast the guess as a chat message to everyone
                io.to(roomId).emit('chat-message', {
                    username: playerName,
                    message: guess,
                    timestamp: Date.now(),
                    type: 'guess'
                });
            }
        });

        socket.on('chat-message', ({ roomId, username, message, emoji }) => {
            let fullMessage = message;
            if (emoji) fullMessage = emoji + (message ? ' ' + message : '');
            
            // Broadcast to room (including self if needed, but here we use socket.to for others)
            socket.to(roomId).emit('chat-message', {
                username,
                message: fullMessage,
                timestamp: Date.now()
            });
        });

        socket.on('cursor-move', ({ roomId, cursorData }) => {
            socket.to(roomId).emit('cursor-move', { socketId: socket.id, ...cursorData });
        });

        socket.on('disconnect', () => {
            // Use roomManager to find all rooms the user was in
            const leftRooms = roomManager.removeUserFromAllRooms(socket.id);
            
            leftRooms.forEach(({ roomId, username }) => {
                const game = gameManager.getGame(roomId);
                
                // Clear their strokes when they disconnect
                roomManager.removeUserStrokes(roomId, socket.id);
                io.to(roomId).emit('remove-user-strokes', socket.id);

                if (game) {
                    game.removePlayer(socket.id);
                    // Notify game participants
                    socket.to(roomId).emit('player_left', { 
                        id: socket.id, 
                        players: game.getPlayerNames() 
                    });
                    
                    if (game.players.size === 0) {
                        gameManager.deleteGame(roomId);
                    } else if (game.currentDrawerId === socket.id && game.state === 'drawing') {
                        game.endRound();
                    }
                }
                
                // General room management notifications
                io.to(roomId).emit('update-users', roomManager.getRoomUsers(roomId));
                io.to(roomId).emit('user-notification', `${username} has left the room.`);
            });
            
            io.emit('user-disconnected', socket.id);
            console.log('User disconnected:', socket.id);
        });

    });
};

module.exports.getIo = getIo;
module.exports.setIo = setIo;