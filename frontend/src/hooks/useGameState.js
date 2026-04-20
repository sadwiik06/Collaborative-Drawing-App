import { useState, useEffect, useCallback } from "react";

export const useGameState = (socket, roomId, playerName) => {
    const [gameState, setGameState] = useState('waiting');
    const [players, setPlayers] = useState([]);
    const [currentDrawerId, setCurrentDrawerId] = useState(null);
    const [roundNumber, setRoundNumber] = useState(0);
    const [maxRounds, setMaxRounds] = useState(3);
    const [turnInfo, setTurnInfo] = useState('');
    const [wordHint, setWordHint] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [roundEndData, setRoundEndData] = useState(null);
    const [finalScores, setFinalScores] = useState([]);
    const [winner, setWinner] = useState('');
    const [isDrawer, setIsDrawer] = useState(false);
    const [wordOptions, setWordOptions] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [initialStrokes, setInitialStrokes] = useState([]);

    // Join room
    useEffect(() => {
        if (!socket || !roomId || !playerName) return;
        socket.emit('join-room', { roomId, username: playerName }, (response) => {
            if (response && response.success) {
                setGameState(response.gameState);
                setPlayers(response.players || []);
                setCurrentDrawerId(response.currentDrawerId);
                setRoundNumber(response.roundNumber || 0);
                setWordHint(response.wordHint || '');
                setIsDrawer(response.currentDrawerId === socket.id);
                // Save past strokes so Canvas can load them upon mounting
                if (response.strokes && response.strokes.length > 0) {
                    setInitialStrokes(response.strokes);
                }
            } else {
                console.error('Join room failed', response?.error);
            }
        });
    }, [socket, roomId, playerName]);

    // Listen for game events
    useEffect(() => {
        if (!socket) return;

        const onPlayerJoined = ({ players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
        };
        const onPlayerLeft = ({ players: updatedPlayers }) => {
            setPlayers(updatedPlayers);
        };
        const onGameRoundStarting = (data) => {
            setRoundNumber(data.roundNumber);
            setMaxRounds(data.maxRounds || 3);
            setCurrentDrawerId(data.drawerId);
            setIsDrawer(data.drawerId === socket.id);
            setTurnInfo(`${data.drawerName}'s turn to draw`);
            setGameState('word_selection');
            setWordOptions([]);

            setChatMessages(prev => [...prev, {
                username: '📢 System',
                message: `Round ${data.roundNumber} — ${data.drawerName} is drawing!`,
                timestamp: Date.now(),
                type: 'system'
            }]);
        };
        const onWordSelection = ({ options, timeLimit }) => {
            setWordOptions(options || []);
            setGameState('word_selection');
        };
        const onDrawingStarted = (data) => {
            setCurrentDrawerId(data.drawerId);
            setIsDrawer(data.drawerId === socket.id);
            setWordHint(data.wordHint);
            setTimeLeft(data.duration);
            setRoundNumber(data.roundNumber || roundNumber);
            setMaxRounds(data.maxRounds || 3);
            setGameState('drawing');
        };
        const onHintUpdate = ({ wordHint: newHint }) => {
            setWordHint(newHint);
        };
        const onTick = ({ timeLeft: remaining }) => {
            setTimeLeft(remaining);
        };
        const onCorrectGuess = ({ guesserId, guesserName, pointsEarned, newScores }) => {
            setPlayers(newScores);
        };
        const onRoundEnd = (data) => {
            setRoundEndData(data);
            setPlayers(data.scores);
            setMaxRounds(data.maxRounds || 3);
            setGameState('round_end');
        };
        const onGameEnd = ({ finalScores: scores, winner: w }) => {
            setFinalScores(scores);
            setWinner(w || 'No winner');
            setGameState('game_end');
        };
        const onGameHold = () => {
            setGameState('waiting');
            setChatMessages(prev => [...prev, {
                username: '📢 System',
                message: 'Waiting for players to continue...',
                timestamp: Date.now(),
                type: 'system'
            }]);
        };
        const onChatMessage = (msg) => {
            setChatMessages(prev => [...prev, msg]);
        };

        socket.on('player_joined', onPlayerJoined);
        socket.on('player_left', onPlayerLeft);
        socket.on('game:round_starting', onGameRoundStarting);
        socket.on('game:word_selection', onWordSelection);
        socket.on('game:drawing_started', onDrawingStarted);
        socket.on('game:hint_update', onHintUpdate);
        socket.on('game:tick', onTick);
        socket.on('game:correct_guess', onCorrectGuess);
        socket.on('game:round_end', onRoundEnd);
        socket.on('game:game_end', onGameEnd);
        socket.on('game:hold', onGameHold);
        socket.on('chat-message', onChatMessage);

        return () => {
            socket.off('player_joined', onPlayerJoined);
            socket.off('player_left', onPlayerLeft);
            socket.off('game:round_starting', onGameRoundStarting);
            socket.off('game:word_selection', onWordSelection);
            socket.off('game:drawing_started', onDrawingStarted);
            socket.off('game:hint_update', onHintUpdate);
            socket.off('game:tick', onTick);
            socket.off('game:correct_guess', onCorrectGuess);
            socket.off('game:round_end', onRoundEnd);
            socket.off('game:game_end', onGameEnd);
            socket.off('game:hold', onGameHold);
            socket.off('chat-message', onChatMessage);
        };
    }, [socket, roundNumber]);

    const startGame = useCallback(() => {
        if (socket) socket.emit('game:start', { roomId });
    }, [socket, roomId]);

    const selectWord = useCallback((word) => {
        if (socket) socket.emit('game:select_word', { roomId, word });
    }, [socket, roomId]);

    const makeGuess = useCallback((guess) => {
        if (socket) socket.emit('game:guess', { roomId, guess });
    }, [socket, roomId]);

    const resetGame = useCallback(() => {
        setChatMessages([]);
        window.location.reload();
    }, []);

    return {
        gameState,
        players,
        currentDrawerId,
        roundNumber,
        maxRounds,
        turnInfo,
        wordHint,
        timeLeft,
        roundEndData,
        finalScores,
        winner,
        isDrawer,
        wordOptions,
        chatMessages,
        initialStrokes,
        startGame,
        selectWord,
        makeGuess,
        resetGame
    };
};
