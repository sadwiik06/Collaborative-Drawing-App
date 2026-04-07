const express = reuire('express');
const router = express.Router()

router.get('/rooms/:roomId',(req,res=>{
        res.json({message: `Room ${req.params.roomId} info placeholder`});
}));
router.get('/health',(req,res)=>{
        res.json({status: 'ok'});
})
module.exports = router;

