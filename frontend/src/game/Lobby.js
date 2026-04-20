import React from 'react';

const Lobby = ({ players }) => {
    return (
        <div className='lobby'>
            <h2>Game Lobby</h2>
            <div className='players-list'>
                <h3>Players ({players.length})</h3>
                <ul>
                    {players.map(p => (
                        <li key={p.id}>{p.name} - Score: {p.score}</li>
                    ))}
                </ul>
            </div>
            {players.length >= 2 ? (
                <p className="auto-start-msg">🎮 Game starting automatically...</p>
            ) : (
                <p>Waiting for more players to join...</p>
            )}
        </div>
    );
};

export default Lobby;