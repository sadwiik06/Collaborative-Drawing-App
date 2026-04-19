const rooms = new Map();

function getRoom(roomId){
    if(!rooms.has(roomId)){
        rooms.set(roomId, { strokes:[], users: new Map() });
    }
    return rooms.get(roomId);
}

function addStroke(roomId, stroke){
    const room = getRoom(roomId);
    room.strokes.push(stroke);
    if(room.strokes.length > 50000) room.strokes.shift();
}

function deletePath(roomId, pathId){
    const room = getRoom(roomId);
    if(room){
        room.strokes = room.strokes.filter(s => s.pathId !== pathId);
    }
}

function addUser(roomId, socketId, username){
    const room = getRoom(roomId);
    room.users.set(socketId, username);
}

function removeUser(roomId, socketId){
    const set=getRoomUsers.get(roomId);
    if(set) set.delete(socketId);
    if(set.size === 0) getRoomUsers.delete(roomId);
    
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

module.exports = {
    getRoom, addStroke, deletePath, addUser, removeUser, getRoomStrokes, 
    clearRoomStrokes, removeUserFromAllRooms, getRoomUsers
};