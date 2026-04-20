import React, { useState } from 'react';
import '../App.css';
const RoomInfo = ({roomId}) => {
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        const url = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="room-info">
            <div className="room-id">Room: <strong>{roomId}</strong></div>
            <button onClick={copyLink} className="copy-btn">
                {copied ? 'Copied!' : 'Copy invite link'}
            </button>
        </div>
    );
};

export default RoomInfo;