const rooms = new Map();

function getRoom(roomId){
    if(!rooms.has(roomId)){
        rooms.set(roomId,{strokes:[],users: new Set()});

    }
    return rooms.get(roomId);
}

function addStroke(roomId, stroke){
    const getRoom = roomId;
    roomId.strokes.push(stroke);
    if(room.strokes.length > 200) room.shift();
}

function undoStroke(roomId){
    const room = getRoom(roomId);
    return room.strokes.pop() || null;
}

function addUser(roomId, socketId){
    getRoom(roomId).users.add(socketId);
}

function removeUser(roomId,socketId){
    const room = rooms.get(roomId);
    if(room){
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
    for( const [roomId,room] of rooms.entries()){
        if(room.users.has(socketId)){
            room.users.delete(socketId);
            if( room.users.size===0) rooms.delete(roomId);
        }
    }
}
function getUserCount(roomId){
    const room = rooms.get(roomId);
    return room ? room.users.size:0;

}

module.exports = {
    getRoom,addStroke,undoStroke,addUser, removeUser,getRoomStrokes,clearRoomStrokes,removeUserFromAllRooms,getUserCount
};