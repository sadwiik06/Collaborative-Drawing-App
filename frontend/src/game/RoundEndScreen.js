import React from 'react';
import Scoreboard from './Scoreboard';
import '../App.css';
const RoundEndScreen = ({ roundEndData }) => {
    const { roundNumber, word, scores, correctGuessesCount } = roundEndData || {};
    
    return (
        <div className='round-end-card'>
            <div className="round-end-header">
                <h2>Round {roundNumber} Over!</h2>
            </div>
            
            <div className="word-reveal">
                <span className="word-label">The word was</span>
                <div className="revealed-word">{word}</div>
            </div>
            
            <div className="round-details">
                {correctGuessesCount !== undefined && (
                    <div className="detail-item">
                        <span>{correctGuessesCount} correct guesses</span>
                    </div>
                )}
            </div>
            
            <div className="round-scores-section">
                <h3>Round Results</h3>
                <Scoreboard players={scores || []} />
            </div>
            
            <div className='next-round-footer'>
                <div className='next-round-wait'>Next round starting soon...</div>
            </div>
        </div>
    );
};
export default RoundEndScreen;