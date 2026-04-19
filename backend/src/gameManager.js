const {getWordOptions,getRandomWord} = require('./wordList');

const GAME_STATES={
    WAITING: 'waiting',
    WORD_SELECTION: 'words_selection',
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
        this.roundNumber=0;
        this.maxRounds=3;
        this.roundTimer=null;
    }
    addPlayer(socketId,playerName){
        if(this.players.has(socketId)) return;
        this.players.set(socketId,{name: playerName, score: 0});

    }
    removePlayer(socketId){
        this.players.delete(socketId);
        if(this.players.size===0){
            this.stopRoundTimer();
        }
    }
    getPlayerNames(){
        return Array.from(this.players.entries()).map(([id,p])=>({id,name:p.name,score:p.score}));
    }
    startGame(){
        if(this.state !== GAME_STATES.WAITING) return false;
        this.roundNumber = 0;
        this.startNextRound();
        return true;
    }
    startNextRound(){
        this.roundNumber++;
        if(this.roundNumber>this.maxRounds){
            this.endGame();
            return;
        }
        this.correctGuesses.clear();
        this.state=GAME_STATES.WORD_SELECTION;
        this.playerIds=Array.from(this.players.keys());
        const currentIndex=this.playerIds.indexOf(this.currentDrawerId);
        const nextIndex=(currentIndex+1)%this.playerIds.length;
        this.currentDrawerId=this.playerIds[nextIndex];
        this.wordOptions=getWordOptions('medium');
        const drawerSocket=this.getSocketById(this.currentDrawerId);
        if(drawerSocket){
            drawerSocket.emit('game:word_selection',{options:this.wordOptions,timeLimit:15});
        }
        this.broadcastToRoom('game:round_starting',{
            roundNumber:this.roundNumber,
            drawerId:this.currentDrawerId,
            drawerName:this.players.get(this.currentDrawerId).name,
        });
        this.wordSelectionTimer=setTimeout(()=>{
            if(this.state !== GAME_STATES.WORD_SELECTION){
                this.selectWord(this.wordOptions[0]);
            }
        },15000);

    }
    selectWord(word){
        if(this.state === GAME_STATES.WORD_SELECTION){
            return ;
        }
        clearTimeout(this.wordSelectionTimer);
        this.currentWord = word;
        this.state=GAME_STATES.DRAWING;
        this.roundStartTime=Date.now();
        const hint=word.split('').map(c=> /[a-zA-Z]/.test(c)?'_':c).join(' ');
        this.broadcastToRoom('game:drawing_started',{
            drawerId: this.currentDrawerId,
            wordHint:hint,
            duration:this.roundDuration
        });
        this.startRoundTimer();
    }
    startRoundTimer(){
        if(this.roundTimer) clearInterval(this.roundTimer);
        let timeLeft=this.roundDuration;
        this.roundTimer=setInterval(()=>{
            // FIX 9: this.starts typo — corrected to this.state
            if(this.state !== GAME_STATES.DRAWING) return;
            timeLeft--;
            this.broadcastToRoom('game:tick',{timeLeft});
            if(timeLeft<=0){
                this.endRound();
            }
        },1000);
    }
    stopRoundTimer(){
        if(this.roundTimer){
            clearInterval(this.roundTimer);
            this.roundTimer=null;
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
            const guesserSocket=this.getSocketById(socketId);
            if(guesserSocket){
                guesserSocket.emit('game:wrong_guess',{guess});
            }
            return {success:false,reason: 'Wrong guess'};
        }
    }
    calculatePoints(timeTaken){
        if(timeTaken<5) return 500;
        if(timeTaken<15) return 400;
        if(timeTaken<30) return 300;
        if (timeTaken < 60) return 200;
        return 100;
    }
    endRound(){
        if(this.state !== GAME_STATES.DRAWING) return;
        this.stopRoundTimer();
        this.state=GAME_STATES.ROUND_END;
        this.broadcastToRoom('game:round_end',{
            word:this.currentWord,
            scores:this.getScores(),
            roundNumber:this.roundNumber,
            correctGuessesCount:this.correctGuesses.size

        });
        setTimeout(()=>{
            if(this.state===GAME_STATES.ROUND_END){
                this.startNextRound();
            }
        },5000);
    }
    endGame(){
        this.state=GAME_STATES.WAITING;
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
        let maxScore = 1;
        for(const [,p] of this.players.entries()){
            if(p.score > maxScore){
                maxScore=p.score;
                winner=p.name;
            }
        }
        return winner;
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
