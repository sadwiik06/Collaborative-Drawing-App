import React from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
// import Chat from './components/Chat';
// import RoomInfo from './components/RoomInfo';
// import { useSocket } from './hooks/useSocket';
import './App.css';

function App(){
  // const [roomId, setRoomId] =  useState('');
  // const {socket, isConnected}  = useSocket('http://localhost:3000');
  
  // useEffect(()=>{
  //   const params = new URLSearchParams(window.location.search);
  //   const room = params.get('room') || `room- ${Math.floor(Math.random()*10000)}`;
  //   setRoomId(room);
  // },[]);

  // if(!roomId) return <div className='loading'> Loading...</div>;

  return(
    <div className='app'>
      <Toolbar />
      <div className="canvas-container">
          <Canvas />
      </div>
      {/* <RoomInfo roomId={roomId} /> */}
      {/* <Chat socket={socket} roomId={roomId} /> */}
    </div>
  )
}

export default App;