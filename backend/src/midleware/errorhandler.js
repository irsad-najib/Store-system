const { Prisma } = require('@prisma/client');

const errorHandler = (error, req, res, next) => {
    console.error('Error', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return res.status(409).json({ error: 'A record with this value already exists' });

            case 'P2025':
                return res.status(404).json({ error: 'Record not found' });
            default:
                return res.status(500).json({ error: 'Database error' });
        }
    }

    if (error.name === 'jsonWebTokenError') {
        return res.status(401).json({ error: 'Token Expired' });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({
        error: 'Internal server error'
    });
};

module.exports = errorHandler