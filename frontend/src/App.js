import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import RoomInfo from './components/RoomInfo';
import Chat from './components/Chat';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import Lobby from './game/Lobby';
import WordSelection from './game/WordSelection';
import RoundEndScreen from './game/RoundEndScreen';
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
              roomId={roomId}
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
            <header className="game-header">
                <div className="game-timer">
                    {timeLeft}
                </div>
                <div className="game-round-info">
                    <span className="round-label">Round</span>
                    <span className="round-value">{roundNumber} / {maxRounds}</span>
                </div>
                <div className="game-word-area">
                    <span className="game-word-label">{isDrawer ? 'DRAW THIS' : 'GUESS THIS'}</span>
                    <span className={`game-word ${!isDrawer && wordHint.includes('_') ? 'hidden' : ''}`}>
                        {wordHint}
                    </span>
                </div>
                <div className="game-header-right">
                    <RoomInfo roomId={roomId} />
                </div>
            </header>

            <div className="main-area">
                <div className="sidebar">
                    <h3>Players</h3>
                    <ul className="user-list">
                        {players.sort((a,b) => b.score - a.score).map((player, index) => (
                            <li key={player.id || index} className="player-item">
                                <span className={`player-rank rank-${index + 1}`}>{index + 1}</span>
                                <div className="player-avatar" style={{ backgroundColor: `hsl(${index * 137.5 % 360}, 50%, 50%)` }}>
                                    {player.name[0].toUpperCase()}
                                </div>
                                <div className="player-info">
                                    <div className={`player-name ${player.name === username ? 'is-you' : ''}`}>
                                        {turnInfo?.drawerId === player.id && <span>✏️ </span>}
                                        {player.name}
                                    </div>
                                    <div className="player-score">{player.score} points</div>
                                </div>

                            </li>
                        ))}
                    </ul>
                    <div style={{ marginTop: 'auto', padding: '10px' }}>
                        <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
                    </div>
                </div>

                <div className="content-area">
                    <div className="canvas-wrapper">
                        {isDrawer && <Toolbar />}
                        <Canvas 
                            socket={socket} 
                            roomId={roomId} 
                            username={username} 
                            isDrawer={isDrawer} 
                            isDrawingPhase={true} 
                            initialStrokes={initialStrokes} 
                        />
                    </div>
                    <Chat
                        messages={chatMessages}
                        onSendMessage={makeGuess}
                        isDrawer={isDrawer}
                    />
                </div>
            </div>
          </div>
        );
      case 'round_end':
        return (
          <div className="game-overlay-container">
            <RoundEndScreen roundEndData={roundEndData} />
          </div>
        );
      case 'game_end':
        return (
          <div className="game-overlay-container">
            <div className="game-end-view">
                <h1>Game Over!</h1>
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
      <div className="lobby-screen">
        <div className="lobby-card">
            <div className="skribbl-logo">
                <span className="s">S</span>
                <span className="k">k</span>
                <span className="r">r</span>
                <span className="i">i</span>
                <span className="b1">b</span>
                <span className="b2">b</span>
                <span className="l">l</span>
                <span className="dot">.</span>
                <span className="io">io</span>
                <span className="ex">!</span>
            </div>
            <div style={{ width: '100%' }}>
                <input 
                    className="lobby-input"
                    type="text" 
                    placeholder="Enter your name" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus 
                />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <button className="lobby-btn" onClick={joinWorldRoom}>Play World</button>
                <button className="lobby-btn secondary" onClick={createPrivateRoom}>Create Private Room</button>
            </div>
        </div>
      </div>
    );
  }

  if(!roomId) return <div className='loading'>Loading...</div>;

  if(!username && !isHome) {
    return (
      <div className='app'>
        <div className="lobby-screen">
          <div className="lobby-card">
              <div className="skribbl-logo">
                  <span className="s">S</span>
                  <span className="k">k</span>
                  <span className="r">r</span>
                  <span className="i">i</span>
                  <span className="b1">b</span>
                  <span className="b2">b</span>
                  <span className="l">l</span>
                  <span className="dot">.</span>
                  <span className="io">io</span>
                  <span className="ex">!</span>
              </div>
              <form className="join-modal" onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.username.value.trim();
                  if(name) setUsername(name);
              }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <h2 style={{ fontFamily: "'Baloo 2', cursive", color: 'var(--blue-dark)', fontSize: '24px', margin: 0 }}>Join Room</h2>
                  <p className="invite-label" style={{ margin: 0 }}>Room ID: <strong style={{ color: 'var(--blue-mid)' }}>{roomId}</strong></p>
                  <input 
                      className="lobby-input"
                      type="text" 
                      name="username" 
                      placeholder="Enter your name" 
                      autoFocus 
                      required 
                  />
                  <button className="lobby-btn" type="submit">Join Game</button>
              </form>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div className='app'>
      {notification && <div className="toast">{notification}</div>}
      {gameState === 'drawing' ? (
          renderGameContent()
      ) : (
          <div className="lobby-screen" style={{ width: '100%', height: '100%' }}>
              {renderGameContent()}
          </div>
      )}
    </div>
  )
}

export default App;