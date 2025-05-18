const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../midleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req, res) => {
    try {
        // Ambil userId dari token yang sudah diverifikasi di middleware
        const userId = req.user?.userId;
        console.log('User ID:', userId);
        const { items, total, paymentMethod, userType } = req.body;
        console.log('Transaction request:', req.body);

        // Validasi input
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required and cannot be empty' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ error: 'Payment method is required' });
        }

        if (!userType) {
            return res.status(400).json({ error: 'Customer type is required' });
        }

        // Verifikasi produk dan stok
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: items.map(item => item.id),
                },
            },
            select: {
                id: true,
                stock: true,
                customerSellPrice: true,
                resellerSellPrice: true,
            },
        });

        // Buat map untuk mempermudah pengecekan
        const productMap = new Map(products.map(p => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.id);

            if (!product) {
                return res.status(404).json({
                    error: `Product with id ${item.id} not found`,
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${item.id}. Available: ${product.stock}, Requested: ${item.quantity}`,
                });
            }

            // Validasi harga
            const expectedPrice =
                userType === 'reseller' ? product.resellerSellPrice : product.customerSellPrice;

            const submittedPrice =
                userType === 'reseller' ? item.resellerSellPrice : item.customerSellPrice;

            if (expectedPrice !== submittedPrice) {
                return res.status(400).json({
                    error: `Price mismatch for product ${item.id}`,
                });
            }
        }

        console.log('Transaction is valid');

        // Proses transaksi dalam satu atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // 1. Buat data penjualan
            const sales = await Promise.all(
                items.map(item => {
                    const unitPrice =
                        userType === 'reseller'
                            ? item.resellerSellPrice
                            : item.customerSellPrice;

                    return tx.sale.create({
                        data: {
                            productId: item.id,
                            userId,
                            quantity: item.quantity,
                            totalPrice: unitPrice * item.quantity,
                            paymentType: paymentMethod,
                            customerType: userType,
                        },
                    });
                })
            );

            // 2. Update stok produk
            await Promise.all(
                items.map(item =>
                    tx.product.update({
                        where: { id: item.id },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    })
                )
            );

            // 3. Buat log audit
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'SALE',
                    details: JSON.stringify({
                        items,
                        total,
                        paymentMethod,
                        userType,
                        salesIds: sales.map(sale => sale.id),
                    }),
                },
            });

            return sales;
        });

        // Kirim response
        res.json({
            message: 'Transaction completed successfully',
            sales: result,
        });
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({
            error: 'Failed to process transaction',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

module.exports = router;
