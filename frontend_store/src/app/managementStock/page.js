'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        stock: 0,
        buyPrice: 0,
        sellPrice: 0,
        categoryId: '',
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = 'http://localhost:3033/api/products';
            if (selectedCategory) {
                url = `http://localhost:3033/api/products/category/${selectedCategory}`;
            }
            if (searchQuery) {
                url = `http://localhost:3033/api/products/search?query=${searchQuery}`;
            }
            const response = await axios.get(url);
            console.log("Fetched Products:", response.data);
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:3033/api/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3033/api/products', newProduct);
            setNewProduct({
                name: '',
                description: '',
                stock: 0,
                buyPrice: 0,
                resellerSellPrice: 0,
                customerSellPrice: 0,
                categoryId: '',
            });
            fetchProducts();
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [searchQuery, selectedCategory]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Stock Management System
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-black w-full p-2 border rounded-md"
                        />
                        <select
                            className="text-black w-full p-2 border rounded-md"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Table */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border p-2 text-black">Name</th>
                                            <th className="border p-2 text-black">Category</th>
                                            <th className="border p-2 text-black">Stock</th>
                                            <th className="border p-2 text-black">Buy Price</th>
                                            <th className="border p-2 text-black">reseller price</th>
                                            <th className="border p-2 text-black">Customer price</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td className="border p-2">
                                                    <div className="text-black font-medium">{product.name}</div>
                                                    <div className="text-black text-sm ">{product.description}</div>
                                                </td>
                                                <td className="text-black border p-2">
                                                    {product.category?.name || 'Uncategorized'}
                                                </td>
                                                <td className="border p-2">
                                                    <span
                                                        className={`px-2 py-1 rounded-full ${product.stock <= 10
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-black'
                                                            }`}
                                                    >
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="border p-2 text-black">Rp.{product.buyPrice.toFixed(2)}</td>
                                                <td className="border p-2 text-black">Rp.{product.customerSellPrice.toFixed(2)}</td>
                                                <td className="border p-2 text-black">Rp.{product.resellerSellPrice.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Add Product Form */}
                    <div>
                        <div className="bg-white rounded-lg shadow p-4 text-black">
                            <h2 className="text-lg font-bold mb-4 ">Add Product</h2>
                            <form onSubmit={handleAddProduct}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, name: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newProduct.description}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, description: e.target.value })
                                        }
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stock</label>
                                        <input
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) =>
                                                setNewProduct({ ...newProduct, stock: +e.target.value })
                                            }
                                            className="w-full p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Buy Price</label>
                                        <input
                                            type="number"
                                            value={newProduct.buyPrice}
                                            onChange={(e) =>
                                                setNewProduct({ ...newProduct, buyPrice: +e.target.value })
                                            }
                                            className="w-full p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Reseller Sell Price</label>
                                        <input
                                            type="number"
                                            value={newProduct.resellerSellPrice}
                                            onChange={(e) =>
                                                setNewProduct({ ...newProduct, resellerSellPrice: +e.target.value })
                                            }
                                            className="w-full p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Customer Sell Price</label>
                                        <input
                                            type="number"
                                            value={newProduct.customerSellPrice}
                                            onChange={(e) =>
                                                setNewProduct({ ...newProduct, customerSellPrice: +e.target.value })
                                            }
                                            className="w-full p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category</label>
                                        <select
                                            value={newProduct.categoryId}
                                            onChange={(e) =>
                                                setNewProduct({ ...newProduct, categoryId: e.target.value })
                                            }
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                                >
                                    Add Product
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
