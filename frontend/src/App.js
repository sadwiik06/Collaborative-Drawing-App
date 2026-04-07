import React, {useState, useEffect} from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import Chat from './components/Chat';
import RoomInfo from './components/RoomInfo';
import {useSocket} from './hooks/useSocket';

function App(){
  const [roomId, setRoomId] =  useState('');
  const {socket, isConnected}  = useSocket('http://localhost:3000');
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room') || `room- ${Math.floor(Math.random()*10000)}`;
    setRoomId(room);
  },[]);

  if(!roomId) return <div className='loading'> Loading...</div>;
  return(
    <div className='app'>
      <Toolbar socket={socket} roomId={roomId}/>
      <Canvas socket={socket} roomId={roomId}/>
      <RoomInfo roomId = {roomId}/>
    </div>
  )
}