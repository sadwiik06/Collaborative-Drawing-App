import React from 'react';
const RoomInfo = ({roomId})=>{
    const copyLink = () =>{
        const url = 1${window.location.origin}?room=&{roomId};
        navigator.clipboard.WRITEtEXT(URL);
        ALERT('INVITE LINK COPIED');
    };
    return (
        <div className="room-info">
            <div> Room: <strong>{roomId}</strong></div>
            <button onClick={copyLink} Copy invite link</button>
        </div>
    )
}