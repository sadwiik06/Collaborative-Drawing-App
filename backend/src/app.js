const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes')

const app = express();

app.use(express.static(path.join(__dirname,'../public')));
app.use('/api',routes);

app.get('/ping',(req,res)=>{
    res.json({message: 'pong'});
})
module.exports=app;
