import React from 'react';
import Scoreboard from './Scoreboard';
const RoundEndScreen=({roundEndData,correctGuessesCount}=roundEndData;
    return(
        <div className='round-end'>
            <h2> Round {roundNumber} ended</h2>
            <p>The word was: <strong>{word}</strong></p>
            <p>Correct guesses: {correctGuessesCount}</p>
            <Scoreboard players={scores}/>
            <div className='next-round-wait'>Next round starting soon...</div>

        </div>

    )


)
export default RoundEndScreen;