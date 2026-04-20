import React, { useState } from 'react';
import '../App.css';

const Lobby = ({ players, roomId }) => {
    const [copied, setCopied] = useState(false);
    const inviteLink = window.location.href;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className='lobby-card'>
            <div className='round-end-header' style={{ marginBottom: '10px' }}>
                <h2 className='wobble-constant'>Game Lobby</h2>
            </div>
            
            {roomId?.startsWith('room-') && (
                <div className='invite-section'>
                    <p className='invite-label'>Invite friends to join!</p>
                    <div className='invite-box'>
                        <input 
                            type='text' 
                            readOnly 
                            value={inviteLink} 
                            className='invite-input'
                        />
                        <button 
                            onClick={copyToClipboard} 
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            title="Copy link"
                        >
                            {copied ? '✅' : '📋'}
                        </button>
                    </div>
                </div>
            )}

            <div className='players-list' style={{ width: '100%', maxWidth: 'none', marginTop: '10px' }}>
                <h3>Players ({players.length})</h3>
                <ul style={{ maxHeight: '180px' }}>
                    {players.map((p, i) => (
                        <li key={p.id || i} className='player-item'>
                            <div className='player-avatar' style={{ width: '28px', height: '28px', fontSize: '12px', background: `hsl(${i * 137.5 % 360}, 50%, 50%)` }}>
                                {p.name[0].toUpperCase()}
                            </div>
                            <span className='player-name' style={{ flex: 1, fontSize: '14px' }}>{p.name}</span>
                            <small className='player-score'>{p.score} pts</small>
                        </li>
                    ))}
                </ul>
            </div>

            <div className='lobby-footer' style={{ marginTop: '20px' }}>
                {players.length >= 2 ? (
                    <div className="next-round-wait">Starting soon...</div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '14px' }}>
                        Waiting for more players ({players.length}/2)...
                    </p>
                )}
            </div>
        </div>
    );
};

export default Lobby;