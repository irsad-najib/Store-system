const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        console.log('Products fetched:', products);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET products by category
router.get('/category/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    try {
        const products = await prisma.product.findMany({
            where: {
                categoryId: parseInt(categoryId),
            },
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET products by search query
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: query
                },
            },
            // tambahkan select untuk memastikan semua field yang diperlukan
            select: {
                id: true,
                name: true,
                stock: true,
                customerSellPrice: true,
                resellerSellPrice: true,
                description: true,
                categoryId: true
            }
        });
        console.log('Search results:', products); // untuk debugging
        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST add new product
router.post('/', async (req, res) => {
    const { name, description, stock, buyPrice, customerSellPrice, resellerSellPrice, categoryId } = req.body;
    try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                stock,
                buyPrice,
                resellerSellPrice,
                customerSellPrice,
                categoryId: parseInt(categoryId),
            },
        });
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:productId/stock', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { stock: true }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ stock: product.stock });
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

// Update product stock
router.put('/:productId/stock', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Ensure we don't go below 0 stock
        const newStock = Math.max(0, product.stock - quantity);

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { stock: newStock }
        });

        res.json({ stock: updatedProduct.stock });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

module.exports = router;
