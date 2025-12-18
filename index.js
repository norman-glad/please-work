require('dotenv').config()
const express = require('express');
const app = express();
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const router = require('./routes/router');


// Mongo DB Connections
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CON);
        console.log('MongoAtlas Connection Succeeded.');
    } catch (error) {
        console.log('Error in DB connection: ' + error);
    }
};

// Middleware Connections
app.use(cors())
app.use(express.json())

// router 
app.use(router)

// Only connect to DB and start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
    app.listen(process.env.PORT, () => {
        console.log('App running in port: ' + process.env.PORT)
    });
}

module.exports = { app, connectDB };


