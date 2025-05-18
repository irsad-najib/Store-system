const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const authenticateToken = require('../midleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Hash password
        const hashPassword = async (password) => {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);

                return hashedPassword;
            } catch (error) {
                console.error('Error hashing password:', error);
            };

        };

        const userExists = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (userExists) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true
            }
        });

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'user not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid pasword' });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.cookie('authToken', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: 'none',
            maxAge: 3600000,
            path: '/'
        });

        console.log('Login Success:', {
            userId: user.id,
            email: user.email,
            role: user.role
        });

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

router.get('/verify-session', authenticateToken, async (req, res) => {
    try {

        if (!req.user?.userId) {  // Ubah req.userId menjadi req.user.userId
            return res.status(401).json({
                authenticated: false,
                error: 'User ID is missing or invalid'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },  // Ubah req.userId menjadi req.user.userId
            select: {
                email: true,
                role: true
            }
        });

        if (!user) {
            return res.status(401).json({
                authenticated: false,
                message: 'User not found'
            });
        }

        // Prevent caching of sensitive routes
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json({
            authenticated: true,
            user
        });
    } catch (error) {
        console.error('Session verification error:', error);
        return res.status(500).json({
            authenticated: false,
            message: 'Internal server error during verification'
        });
    }
});

router.post('/logout', (req, res) => {
    try {
        console.log("p");

        res.clearCookie('authToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        });
        console.log("logout success")

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
});

module.exports = router; 
