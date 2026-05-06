const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/caregiver', require('./routes/caregiver'));
app.use('/api/request', require('./routes/request'));

// CONNECT DB
mongoose.connect('mongodb://127.0.0.1:27017/dementia-app')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// START SERVER
app.listen(5000, () => console.log("Server running on port 5000"));