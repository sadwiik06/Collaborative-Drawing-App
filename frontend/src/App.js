import React, { useState, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import RoomInfo from './components/RoomInfo';
import { useSocket } from './hooks/useSocket';
import './App.css';

function App(){
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [notification, setNotification] = useState('');
  
  const lastJoinedSocketId = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
  const {socket, isConnected} = useSocket(BACKEND_URL);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if(!room){
      room = `room-${Math.floor(Math.random()*10000)}`;
      window.history.replaceState(null, '', `?room=${room}`);
    }
    setRoomId(room);
  }, []);

  useEffect(() => {
    if (socket && isConnected && roomId && username && lastJoinedSocketId.current !== socket.id) {
      lastJoinedSocketId.current = socket.id;
      
      socket.emit('join-room', { roomId, username }, (response) => {
         if(response && response.assignedName && response.assignedName !== username) {
             setUsername(response.assignedName);
             alert(`The username "${username}" is already taken in this room. You are now known as "${response.assignedName}".`);
         }
         if(response && response.strokes) {
             window.dispatchEvent(new CustomEvent('loadStrokes', { detail: response.strokes }));
         }
      });
    }

    if (socket) {
        // We ensure this listener is always active
        socket.on('update-users', (usersArray) => {
            setUsersInRoom(usersArray);
        });

        socket.on('user-notification', (msg) => {
            setNotification(msg);
            setTimeout(() => setNotification(''), 3000);
        });

        return () => {
            socket.off('update-users');
            socket.off('user-notification');
        }
    }
  }, [socket, isConnected, roomId, username]);

  if(!roomId) return <div className='loading'>Loading...</div>;

  if(!username) {
    return (
      <div className="modal-overlay">
        <form className="join-modal" onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.username.value.trim();
            if(name) setUsername(name);
        }}>
            <h2>Join Drawing Room</h2>
            <input type="text" name="username" placeholder="Enter your name" autoFocus required />
            <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return(
    <div className='app'>
      {notification && <div className="toast">{notification}</div>}
      <Toolbar />
      <div className="main-area">
          <div className="sidebar">
              <h3>Currently Drawing</h3>
              <ul className="user-list">
                  {usersInRoom.map((user, index) => (
                      <li key={index}>{user}</li>
                  ))}
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                  <RoomInfo roomId={roomId} />
              </div>
          </div>
          <div className="canvas-container">
              <Canvas socket={socket} roomId={roomId} username={username} />
          </div>
      </div>
    </div>
  )
}

export default App;