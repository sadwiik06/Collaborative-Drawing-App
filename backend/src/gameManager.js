const {getWordOptions,getRandomWord} = require('./wordList');

const GAME_STATES={
    WAITING: 'waiting',
    WORD_SELECTION: 'word_selection',
    DRAWING: 'drawing',
    ROUND_END: 'round_end'
};

class Game{
    constructor(roomId,hostId){
        this.roomId=roomId;
        this.hostId=hostId;
        this.state=GAME_STATES.WAITING;
        this.players = new Map();
        this.currentDrawerId=null;
        this.currentWord=null;
        this.wordOptions=null;
        this.roundStartTime = null;
        this.roundDuration=80;
        this.correctGuesses=new Set();
        this.maxRounds=5;
        this.currentRound=0;    
        this.currentTurnInRound=0; 
        this.totalTurns=0;      
        this.drawOrder=[];      
        
        this.roundTimer=null;
        this.wordSelectionTimer=null;
        this.revealedIndices=new Set(); 
    }

    addPlayer(socketId,playerName){
        if(this.players.has(socketId)) return;
        this.players.set(socketId,{name: playerName, score: 0});
    }

    removePlayer(socketId){
        this.players.delete(socketId);
        if(this.players.size===0){
            this.stopRoundTimer();
        } else if (this.players.size === 1 && this.state !== GAME_STATES.WAITING) {
            // Hold state: Stop the game when only 1 player remains.
            this.stopRoundTimer();
            this.state = GAME_STATES.WAITING;
            this.broadcastToRoom('game:hold', { message: 'Waiting for more players to continue...' });
        }
    }

    getPlayerNames(){
        return Array.from(this.players.entries()).map(([id,p])=>({id,name:p.name,score:p.score}));
    }

    startGame(){
        if(this.state !== GAME_STATES.WAITING) return false;
        this.currentRound = 0;
        this.currentTurnInRound = 0;
        this.totalTurns = 0;
        this.drawOrder = Array.from(this.players.keys());
        
        // Reset all scores
        for(const [,p] of this.players.entries()){
            p.score = 0;
        }
        
        this.startNextTurn();
        return true;
    }

    startNextTurn(){
        // Check if we need to move to next round
        if(this.currentTurnInRound >= this.drawOrder.length){
            this.currentTurnInRound = 0;
            this.currentRound++;
        }
        
        // First turn starts round 1
        if(this.currentRound === 0) this.currentRound = 1;
        
        // Check if all rounds are done
        if(this.currentRound > this.maxRounds){
            this.endGame();
            return;
        }

        this.totalTurns++;
        this.correctGuesses.clear();
        this.revealedIndices.clear();
        this.state = GAME_STATES.WORD_SELECTION;
        
        // Refresh draw order in case players left/joined
        this.drawOrder = Array.from(this.players.keys());
        if(this.drawOrder.length === 0) return;
        
        // Wrap turn index
        if(this.currentTurnInRound >= this.drawOrder.length){
            this.currentTurnInRound = 0;
        }
        
        this.currentDrawerId = this.drawOrder[this.currentTurnInRound];
        this.currentTurnInRound++;
        
        this.wordOptions = getWordOptions('medium');
        
        const totalTurnsInGame = this.maxRounds * this.drawOrder.length;
        
        // Broadcast round_starting FIRST
        this.broadcastToRoom('game:round_starting',{
            roundNumber: this.currentRound,
            maxRounds: this.maxRounds,
            turnNumber: this.totalTurns,
            totalTurns: totalTurnsInGame,
            drawerId: this.currentDrawerId,
            drawerName: this.players.get(this.currentDrawerId).name,
        });

        // Then send word options to drawer
        const drawerSocket = this.getSocketById(this.currentDrawerId);
        if(drawerSocket){
            drawerSocket.emit('game:word_selection',{options:this.wordOptions,timeLimit:15});
        }

        this.wordSelectionTimer = setTimeout(()=>{
            if(this.state === GAME_STATES.WORD_SELECTION){
                this.selectWord(this.wordOptions[0]);
            }
        },15000);
    }

    selectWord(word){
        if(this.state !== GAME_STATES.WORD_SELECTION){
            return;
        }
        clearTimeout(this.wordSelectionTimer);
        this.currentWord = word;
        this.state = GAME_STATES.DRAWING;
        this.roundStartTime = Date.now();
        this.revealedIndices.clear();
        
        const hint = this.buildHint();
        
        this.broadcastToRoom('game:drawing_started',{
            drawerId: this.currentDrawerId,
            wordHint: hint,
            duration: this.roundDuration,
            wordLength: word.length,
            roundNumber: this.currentRound,
            maxRounds: this.maxRounds
        });
        this.startRoundTimer();
    }

    // Build the current hint string with revealed letters
    buildHint(){
        if(!this.currentWord) return '';
        return this.currentWord.split('').map((c, i)=>{
            if(!/[a-zA-Z]/.test(c)) return c; // Keep spaces, hyphens etc
            if(this.revealedIndices.has(i)) return c; // Revealed letter
            return '_';
        }).join(' ');
    }

    // Reveal a random unrevealed letter (but never reveal more than word.length - 2)
    revealLetter(){
        if(!this.currentWord) return;
        const letters = [];
        for(let i = 0; i < this.currentWord.length; i++){
            if(/[a-zA-Z]/.test(this.currentWord[i]) && !this.revealedIndices.has(i)){
                letters.push(i);
            }
        }
        
        // Count total letter positions
        const totalLetters = this.currentWord.split('').filter(c => /[a-zA-Z]/.test(c)).length;
        
        // Never reveal more than totalLetters - 2
        if(this.revealedIndices.size >= totalLetters - 2) return;
        if(letters.length <= 2) return; // Keep at least 2 hidden
        
        // Pick a random unrevealed letter
        const randomIndex = letters[Math.floor(Math.random() * letters.length)];
        this.revealedIndices.add(randomIndex);
        
        // Broadcast updated hint
        const hint = this.buildHint();
        this.broadcastToRoom('game:hint_update', { wordHint: hint });
    }

    startRoundTimer(){
        if(this.roundTimer) clearInterval(this.roundTimer);
        let timeLeft = this.roundDuration;
        
        // Calculate hint reveal intervals
        // Reveal a letter at 66%, 50%, 33%, 20% of time remaining
        const hintTimes = [
            Math.floor(this.roundDuration * 0.66),
            Math.floor(this.roundDuration * 0.50),
            Math.floor(this.roundDuration * 0.33),
            Math.floor(this.roundDuration * 0.20),
            Math.floor(this.roundDuration * 0.10)
        ];
        
        this.roundTimer = setInterval(()=>{
            if(this.state !== GAME_STATES.DRAWING) return;
            timeLeft--;
            
            // Check if it's time to reveal a letter
            const elapsed = this.roundDuration - timeLeft;
            if(hintTimes.includes(elapsed)){
                this.revealLetter();
            }
            
            this.broadcastToRoom('game:tick',{ timeLeft });
            if(timeLeft <= 0){
                this.endRound();
            }
        },1000);
    }

    stopRoundTimer(){
        if(this.roundTimer){
            clearInterval(this.roundTimer);
            this.roundTimer=null;
        }
        if(this.wordSelectionTimer){
            clearTimeout(this.wordSelectionTimer);
            this.wordSelectionTimer=null;
        }
    }

    handleGuess(socketId,guess){
        if(this.state!==GAME_STATES.DRAWING) return {success:false,reason:'Not drawing phase'};
        if(socketId === this.currentDrawerId) return {success:false,reason:"Drawer cannot guess"};
        if(this.correctGuesses.has(socketId)) return {success: false, reason: 'Already guessed correctly'};
        const normalizedGuess = guess.trim().toLowerCase();
        if(normalizedGuess === this.currentWord.toLowerCase()){
            this.correctGuesses.add(socketId);
            const timeTaken=(Date.now()-this.roundStartTime)/1000;
            const points=this.calculatePoints(timeTaken);
            const player=this.players.get(socketId);
            player.score+=points;
            const drawer = this.players.get(this.currentDrawerId);
            drawer.score+=Math.floor(points/2);
            this.broadcastToRoom('game:correct_guess',{
                guesserId:socketId,
                guesserName:player.name,
                pointsEarned:points,
                newScores:this.getScores(),
            });
            const nonDrawers=Array.from(this.players.keys()).filter(id=>id!== this.currentDrawerId);
            if(this.correctGuesses.size===nonDrawers.length){
                this.endRound();
            }
            return {success:true,points};
        } else {
            return {success:false,reason: 'Wrong guess'};
        }
    }

    calculatePoints(timeTaken){
        if(timeTaken<5) return 500;
        if(timeTaken<15) return 400;
        if(timeTaken<30) return 300;
        if(timeTaken < 60) return 200;
        return 100;
    }

    endRound(){
        if(this.state !== GAME_STATES.DRAWING) return;
        this.stopRoundTimer();
        this.state=GAME_STATES.ROUND_END;
        this.broadcastToRoom('game:round_end',{
            word:this.currentWord,
            scores:this.getScores(),
            roundNumber:this.currentRound,
            maxRounds:this.maxRounds,
            correctGuessesCount:this.correctGuesses.size
        });
        setTimeout(()=>{
            if(this.state===GAME_STATES.ROUND_END){
                this.startNextTurn();
            }
        },5000);
    }

    endGame(){
        this.state=GAME_STATES.WAITING;
        this.currentRound = 0;
        this.currentTurnInRound = 0;
        this.totalTurns = 0;
        this.broadcastToRoom('game:game_end',{
            finalScores:this.getScores(),
            winner: this.getWinner()
        });
    }

    getScores(){
        return Array.from(this.players.entries()).map(([id,p])=>({
            id,name:p.name,score:p.score
        }));
    }

    getWinner(){
        let winner=null;
        let maxScore = 0;
        for(const [,p] of this.players.entries()){
            if(p.score > maxScore){
                maxScore=p.score;
                winner=p.name;
            }
        }
        return winner || 'No winner';
    }

    broadcastToRoom(event,data){
        const io=require('./socketManager').getIo();
        io.to(this.roomId).emit(event,data);
    }

    getSocketById(socketId){
        const io=require('./socketManager').getIo();
        return io.sockets.sockets.get(socketId);
    }

    setIoInstance(io){
        this.io=io;
    }
}

const activeGames=new Map();
function getGame(roomId){
    return activeGames.get(roomId);
}
function createGame(roomId,hostId){
    if(activeGames.has(roomId)) return activeGames.get(roomId);
    const game=new Game(roomId,hostId);
    activeGames.set(roomId,game);
    return game;
}
function deleteGame(roomId){
    const game=activeGames.get(roomId);
    if (game) game.stopRoundTimer();
    activeGames.delete(roomId);
}
function setIoForGames(io){
    for( const game of activeGames.values()){
        game.setIoInstance(io);
    }
}
module.exports={
    GAME_STATES,
    getGame,
    createGame,
    deleteGame,
    setIoForGames
};
