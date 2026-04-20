import React,{useState} from 'react';
const GuessingPanel = ({wordHint,timeLeft,onGuess,disabled})=>{
    const [guess,setGuess]=useState('');
    const handleSubmit=(e)=>{
        e.preventDefault();
        if(!guess.trim() || disabled)return;
        onGuess(guess.trim());
        setGuess('');
    };
    return (
        <div className='guessing-panel'>
            <div className='word-hint'>{wordHint}</div>
            <div className='timer'>Time Left: {timeLeft}s</div>
            <form onSubmit={handleSubmit}>
                <input
                type="text" value={guess}
                onChange={(e)=> setGuess(e.target.value)}
                placeholder={disabled ? "You are the drawer":"Type your guess..."}
                disabled={disabled}
                />
                <button type="submit" disabled={disabled}>Guess</button>

            </form>
        </div>
    );
};
export default GuessingPanel;
