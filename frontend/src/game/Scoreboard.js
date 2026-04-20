import React from 'react';
const Scoreboard=({players})=>{
    const sorted=[...players].sort((a,b)=>b.score-a.score);
    return (
        <div className='scoreboard'>
            <h3>Scoreboard</h3>
            <ul>
                {sorted.map(p=>(
                    <li key={p.id}>{p.name}: {p.score}</li>

                ))}
            </ul>
        </div>
    );

}
export default Scoreboard;
