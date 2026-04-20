const rooms = new Map();

function getRoom(roomId){
    return rooms.get(roomId);
}

function createRoom(roomId, type = 'private'){
    if(!rooms.has(roomId)){
        rooms.set(roomId, { strokes:[], users: new Map(), type });
    }
    return rooms.get(roomId);
}

function addStroke(roomId, stroke){
    const room = getRoom(roomId);
    if(room) {
        room.strokes.push(stroke);
        if(room.strokes.length > 50000) room.strokes.shift();
    }
}

function deletePath(roomId, pathId){
    const room = getRoom(roomId);
    if(room){
        room.strokes = room.strokes.filter(s => s.pathId !== pathId);
    }
}

function addUser(roomId, socketId, username){
    const room = getRoom(roomId) || createRoom(roomId);
    room.users.set(socketId, username);
}

function removeUser(roomId, socketId){
    const room = rooms.get(roomId);
    if(room && room.users){
        room.users.delete(socketId);
        if(room.users.size === 0) rooms.delete(roomId);
    }
}

function getRoomStrokes(roomId){
    const room = rooms.get(roomId);
    return room ? room.strokes : [];
}

function clearRoomStrokes(roomId){
    const room = rooms.get(roomId);
    if(room) room.strokes = [];
}

function removeUserFromAllRooms(socketId){
    const leftRooms = [];
    for(const [roomId, room] of rooms.entries()){
        if(room.users.has(socketId)){
            const username = room.users.get(socketId);
            room.users.delete(socketId);
            leftRooms.push({ roomId, username });
            if(room.users.size === 0) rooms.delete(roomId);
        }
    }
    return leftRooms;
}

function getRoomUsers(roomId){
    const room = rooms.get(roomId);
    if(!room) return [];
    return Array.from(room.users.values());
}

function removeUserStrokes(roomId, socketId) {
    const room = getRoom(roomId);
    if (room && room.strokes) {
        room.strokes = room.strokes.filter(s => s.author !== socketId);
    }
}

function findAvailablePublicRoom() {
    for (const [roomId, room] of rooms.entries()) {
        if (room.type === 'public' && room.users.size < 5) {
            return roomId;
        }
    }
    return null;
}

function setRoomType(roomId, type) {
    const room = getRoom(roomId);
    if(room) room.type = type;
}

module.exports = {
    getRoom, createRoom, addStroke, deletePath, addUser, removeUser, getRoomStrokes, 
    clearRoomStrokes, removeUserFromAllRooms, getRoomUsers, findAvailablePublicRoom, setRoomType,
    removeUserStrokes
};