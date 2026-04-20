import React, { useState, useEffect } from "react";

const WordSelection = ({ onSelectWord, timeLimit = 15, wordOptions = [] }) => {
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (wordOptions.length) onSelectWord(wordOptions[0]);
            return;
        }
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, wordOptions, onSelectWord]);

    return (
        <div className="word-selection">
            <h2>Choose a word to draw</h2>
            <div className="timer">Time left: {timeLeft}s</div>
            <div className="word-options">
                {wordOptions.map(word => (
                    <button key={word} onClick={() => onSelectWord(word)}>
                        {word}
                    </button>
                ))}
                {wordOptions.length === 0 && <p>Loading words...</p>}
            </div>
        </div>
    );
};

export default WordSelection;
