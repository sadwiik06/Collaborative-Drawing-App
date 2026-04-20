import React from 'react';
const Scoreboard=({players})=>{
    const sorted=[...players].sort((a,b)=>b.score-a.score);
    return (
        <ul className='user-list'>
            {sorted.map((p, i) => (
                <li key={p.id || i} className="player-item">
                    <span className={`player-rank rank-${i + 1}`}>{i + 1}</span>
                    <div className="player-info">
                        <div className="player-name">{p.name}</div>
                        <div className="player-score">{p.score} pts</div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
export default Scoreboard;
