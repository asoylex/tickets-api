const express = require('express');
const cors = require('cors');

const app = express();



app.use(cors());
app.use(express.json());


app.get('/api/health', (req, res) => {
    res.json({status: 'ok', uptime: process.uptime()});
});

app.use((req, res) => {
    res.status(404).json({error: 'Not Found'});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({message: err.message || 'Internal Server Error'});
});


module.exports = app;