import {useEffect, useState} from 'react';

import io from 'socket.io-client';

export const useSocket = (serveUrl) =>{
    const [socket,setSocket] = useState(null);
    const [isConnected,setIsConnected] = useState(false);
    useEffect(()=>{
        const newSocket = io(serveUrl,{
            transports : ['websocket'],
            upgrade : false
        });
        setSocket(newSocket);
        newSocket.on('connect',()=> setIsConnected(true));
        newSocket.on('disconnect',()=> setIsConnected(false));
        return () =>{
            newSocket.disconnect();
        };
    },[serveUrl]);
    return {socket, isConnected};
}