const express = require('express');
const { WORDS } = require('./wordList');
const router = express.Router();

router.get('/rooms/:roomId',(req,res)=>{
        res.json({message: `Room ${req.params.roomId} info placeholder`});
});
router.get('/health',(req,res)=>{
        res.json({status: 'ok'});
})

router.get('/words/:difficulty',(req,res)=>{
        const difficulty=req.params.difficulty;
        const list=WORDS[difficulty] || WORDS.medium;
        res.json({words:list});
});
router.post('/words',(req,res)=>{
        res.status(501).json({error: 'Not Implemented'})
})
module.exports = router;

