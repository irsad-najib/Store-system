require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const authRouter = require('./routes/auth.routes');
const errorHandler = require('./midleware/errorhandler');
const products = require('./routes/products.routes');
const categories = require('./routes/categories.routes');
const transaction = require('./routes/transaction.routes');
const reports = require('./routes/reports.routes');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT;
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 200
};
console.log("frontend :", process.env.FRONTEND_URL);

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.get('/healt', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRouter);
app.use('/api/products', products);
app.use('/api/categories', categories);
app.use('/api/transaction', transaction);
app.use('/api/reports', reports);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

prisma.$on('query', (e) => {
    console.log('Query executed:', e.query);
    console.log('Duration:', e.duration);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
