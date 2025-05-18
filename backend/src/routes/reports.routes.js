const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

// Input validation schema
const salesQuerySchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    customerType: z.enum(['all', 'regular', 'reseller']),
    paymentType: z.enum(['all', 'cash', 'transfer']),
    search: z.string().optional(),
});

router.get('/sales', async (req, res) => {
    try {
        // Get and validate query parameters
        const queryParams = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            customerType: req.query.customerType,
            paymentType: req.query.paymentType,
            search: req.query.search || '',
        };

        const queryResult = salesQuerySchema.safeParse(queryParams);
        if (!queryResult.success) {
            return res.status(400).json({
                error: 'Invalid query parameters',
                details: queryResult.error.flatten(),
            });
        }

        const { startDate, endDate, customerType, paymentType, search } = queryResult.data;

        // Build the where clause for prisma query
        const whereClause = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
            AND: [],
        };

        if (customerType !== 'all') {
            whereClause.AND.push({ customerType });
        }

        if (paymentType !== 'all') {
            whereClause.AND.push({ paymentType });
        }

        if (search.trim()) {
            whereClause.AND.push({
                product: {
                    name: {
                        contains: search.trim(),
                        mode: 'insensitive',
                    },
                },
            });
        }

        // Fetch sales with related data
        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform the data for the frontend
        const transformedSales = sales.map((sale) => ({
            id: sale.id,
            productName: sale.product?.name ?? 'Unknown',
            quantity: sale.quantity,
            totalPrice: sale.totalPrice,
            customerType: sale.customerType,
            paymentType: sale.paymentType,
            cashierName: sale.user?.name ?? sale.user?.email ?? 'Unknown',
            createdAt: sale.createdAt.toISOString(),
        }));

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: parseInt(req.user?.id || '0'),
                action: 'VIEW_SALES_REPORT',
                details: JSON.stringify({
                    filters: {
                        startDate,
                        endDate,
                        customerType,
                        paymentType,
                        search,
                    },
                    resultCount: transformedSales.length,
                }),
            },
        });

        res.status(200).json(transformedSales);
    } catch (error) {
        console.error('Error in sales report API:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

module.exports = router;
