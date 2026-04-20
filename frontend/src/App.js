import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import RoomInfo from './components/RoomInfo';
import Chat from './components/Chat';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import Lobby from './game/Lobby';
import WordSelection from './game/WordSelection';
import './App.css';

function App(){
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState(() => localStorage.getItem('draw_username') || '');
  const [notification, setNotification] = useState('');
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
  const {socket, isConnected} = useSocket(BACKEND_URL);
  
  const {
    gameState,
    players,
    isDrawer,
    wordHint,
    wordOptions,
    chatMessages,
    initialStrokes,
    timeLeft,
    roundNumber,
    maxRounds,
    turnInfo,
    roundEndData,
    finalScores,
    winner,
    startGame,
    selectWord,
    makeGuess,
    resetGame
  } = useGameState(socket, roomId, username);

  const [isHome, setIsHome] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if(room){
      setRoomId(room);
      setIsHome(false);
    }
  }, []);

  useEffect(() => {
    if (username) localStorage.setItem('draw_username', username);
  }, [username]);

  useEffect(() => {
    if (socket) {
        socket.on('user-notification', (msg) => {
            setNotification(msg);
            setTimeout(() => setNotification(''), 3000);
        });

        return () => {
            socket.off('user-notification');
        }
    }
  }, [socket]);

  const leaveRoom = () => {
    window.location.href = '/';
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'waiting':
        return (
          <div className="game-overlay-container">
            <Lobby
              players={players}
              onStartGame={startGame}
            />
          </div>
        );
      case 'word_selection':
        return (
          <div className="game-overlay-container">
            {isDrawer ? (
                <WordSelection 
                  onSelectWord={selectWord} 
                  timeLimit={15} 
                  wordOptions={wordOptions}
                />
            ) : (
                <div className="waiting-message">
                    <h2>Waiting for drawer to choose a word...</h2>
                </div>
            )}
          </div>
        );
      case 'drawing':
        return (
          <div className="game-layout">
            <div className="main-canvas-area">
                <Toolbar />
                <div className="game-info-bar">
                    <div className="round-info">Round {roundNumber}</div>
                    <div className="word-hint-display">{wordHint}</div>
                    <div className="timer-display">⏱ {timeLeft}s</div>
                </div>
                <div className="canvas-container">
                    <Canvas socket={socket} roomId={roomId} username={username} isDrawer={isDrawer} isDrawingPhase={true} initialStrokes={initialStrokes} />
                </div>
            </div>
            <div className="chat-sidebar">
                <Chat
                    messages={chatMessages}
                    onSendMessage={makeGuess}
                    isDrawer={isDrawer}
                />
            </div>
          </div>
        );
      case 'round_end':
        return (
          <div className="game-overlay-container">
            <div className="round-end-view">
                <h2>Round {roundEndData?.roundNumber} — Turn Over!</h2>
                <p>The word was: <strong>{roundEndData?.word}</strong></p>
                <div className="round-scores">
                    {roundEndData?.scores?.map((p, i) => (
                        <div key={p.id || i} className="score-row">
                            <span>{p.name}</span>
                            <span className="score-value">{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <p className="next-round-wait">Next round starting soon...</p>
            </div>
          </div>
        );
      case 'game_end':
        return (
          <div className="game-overlay-container">
            <div className="game-end-view">
                <h1>🏆 Game Over!</h1>
                <h2>Winner: {winner || 'No winner'}</h2>
                <div className="round-scores">
                    {finalScores?.map((p, i) => (
                        <div key={p.id || i} className="score-row">
                            <span>{p.name}</span>
                            <span className="score-value">{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <button className="primary-btn" onClick={resetGame}>Play Again</button>
            </div>
          </div>
        );
      default:
        return (
          <div className="game-overlay-container">
            <div className="waiting-message">
              <h2>Connecting...</h2>
            </div>
          </div>
        );
    }
  };

  const joinWorldRoom = () => {
    if (!username) return alert('Please enter a username first!');
    if (!socket) return;
    
    socket.emit('find-world-room', (response) => {
       if(response && response.roomId) {
         window.history.replaceState(null, '', `?room=${response.roomId}`);
         setRoomId(response.roomId);
         setIsHome(false);
       }
    });
  };

  const createPrivateRoom = () => {
    if (!username) return alert('Please enter a username first!');
    const newRoom = `room-${Math.floor(Math.random()*10000)}`;
    window.history.replaceState(null, '', `?room=${newRoom}`);
    setRoomId(newRoom);
    setIsHome(false);
  };

  if(isHome) {
    return (
      <div className="modal-overlay">
        <div className="home-modal">
            <h2>Welcome to Collaborative Drawing App!</h2>
            <div className="home-input-group">
                <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus 
                />
            </div>
            <div className="home-action-buttons">
                <button className="primary-btn world-btn" onClick={joinWorldRoom}>🌍 Play World</button>
                <button className="primary-btn private-btn" onClick={createPrivateRoom}>🔒 Create Private Room</button>
            </div>
        </div>
      </div>
    );
  }

  if(!roomId) return <div className='loading'>Loading...</div>;

  if(!username && !isHome) {
    return (
      <div className="modal-overlay">
        <form className="join-modal" onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.username.value.trim();
            if(name) setUsername(name);
        }}>
            <h2>Join Drawing Room</h2>
            <p className="room-label">Room: <strong>{roomId}</strong></p>
            <input type="text" name="username" placeholder="Enter your name" autoFocus required />
            <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return(
    <div className='app'>
      {notification && <div className="toast">{notification}</div>}
      <div className="main-area">
          <div className="sidebar">
              <h3>Players</h3>
              <ul className="user-list">
                  {players.map((player, index) => (
                      <li key={player.id || index}>
                          {player.name} <small>({player.score})</small>
                      </li>
                  ))}
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
                  <RoomInfo roomId={roomId} />
                  <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
              </div>
          </div>
          <div className="content-area">
              {renderGameContent()}
          </div>
      </div>
    </div>
  )
}

export default App;