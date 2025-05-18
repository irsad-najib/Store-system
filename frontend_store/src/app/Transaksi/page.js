'use client';
import React, { useState, useEffect } from 'react';
import { Search, Trash, Printer, Download } from 'lucide-react';
import axios from 'axios';

const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return value.toLocaleString('id-ID');
};

const SearchResults = ({ results, onSelect, userType }) => (
    <div className="absolute w-full bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
        {results.length === 0 ? (
            <div className="p-3 text-gray-500 text-center">No products found</div>
        ) : (
            results.map(product => (
                <div
                    key={product.id}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => onSelect(product)}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-medium">
                                {product.name || 'Unnamed Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                                Stock: {product.stock || 0}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-medium">
                                Rp{formatCurrency(userType === 'reseller' ?
                                    product.resellerSellPrice :
                                    product.customerSellPrice
                                )}
                            </div>
                            {userType === 'reseller' && (
                                <div className="text-sm text-gray-500">
                                    Regular: Rp{formatCurrency(product.customerSellPrice)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

const SelectedItem = ({ item, onUpdateQuantity, onRemove, userType }) => {
    const price = userType === 'reseller' ? item.resellerPrice : item.regularPrice;
    return (
        <div className="flex justify-between items-center mb-2 p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">Rp{formatCurrency(price)} each</div>
                {userType === 'reseller' && (
                    <div className="text-xs text-gray-400">Regular price: Rp{formatCurrency(item.regularPrice)}</div>
                )}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                        -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                        +
                    </button>
                </div>
                <div className="w-32 text-right font-medium">
                    Rp{formatCurrency(price * (item.quantity || 0))}
                </div>
                <button
                    className="p-2 text-red-500 hover:text-red-600 transition-colors"
                    onClick={() => onRemove(item.id)}
                >
                    <Trash className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

const PointOfSale = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [userType, setUserType] = useState('regular');

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
            setSearchResults(response.data);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to fetch products. Please try again.');
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
            setError('Failed to fetch categories. Please try again.');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (searchQuery || selectedCategory) {
            const debounce = setTimeout(() => {
                fetchProducts();
            }, 300);
            return () => clearTimeout(debounce);
        } else {
            setShowSearchResults(false);
            setSearchResults([]);
        }
    }, [searchQuery, selectedCategory]);

    const addItem = (product) => {
        setSelectedItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                ...product,
                quantity: 1,
                regularPrice: product.customerSellPrice,
                resellerPrice: product.resellerSellPrice
            }];
        });
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            const response = await axios.get(`http://localhost:3033/api/products/${productId}/stock`);
            const availableStock = response.data.stock;

            if (newQuantity > availableStock) {
                alert(`Only ${availableStock} items available in stock`);
                return;
            }

            setSelectedItems(prev =>
                prev.map(item =>
                    item.id === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        } catch (error) {
            console.error('Error checking stock:', error);
            alert('Failed to verify stock availability');
        }
    };

    const removeItem = (productId) => {
        setSelectedItems(prev => prev.filter(item => item.id !== productId));
    };

    const total = selectedItems.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const price = userType === 'reseller' ? item.resellerPrice : item.regularPrice;
        return sum + (price * quantity);
    }, 0);

    const handleTransactionComplete = async (type) => {
        try {
            // Validate items and payment method
            if (selectedItems.length === 0) {
                alert('Please select items for the transaction');
                return;
            }

            if (!selectedPayment) {
                alert('Please select a payment method');
                return;
            }

            // Create transaction
            await axios.post('http://localhost:3033/api/transaction', {
                items: selectedItems.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    customerSellPrice: item.customerSellPrice,
                    resellerSellPrice: item.resellerSellPrice
                })),
                total,
                paymentMethod: selectedPayment,
                userType,

            }, {
                withCredentials: true,
            });
            console.log('Transaction completed successfully');
            if (type === 'print') {
                handlePrint();
            } else {
                handleDownload();
            }

            // Reset state after successful transaction
            setSelectedItems([]);
            setSelectedPayment('');
            setShowModal(false);

            alert('Transaction completed successfully');
        } catch (error) {
            console.error('Error completing transaction:', error);
            const errorMessage = error.response?.data?.error || 'Failed to complete transaction';
            alert(errorMessage);
        }
    };
    const handlePrint = () => {
        // Create receipt content with proper formatting for thermal printer
        const printContent = `
            <div style="font-family: 'Courier New', monospace; width: 300px; margin: 0 auto;">
                <!-- Header with Logo -->
                <div style="text-align: center; margin-bottom: 10px;">
                    <svg width="100" height="50" viewBox="0 0 100 50">
                        <!-- Simple store icon -->
                        <rect x="35" y="10" width="30" height="30" fill="#000"/>
                        <text x="50" y="45" text-anchor="middle" style="font-size: 8px;">STORE NAME</text>
                    </svg>
                    <div style="font-size: 14px; font-weight: bold;">Your Store Name</div>
                    <div style="font-size: 12px;">Store Address Line 1</div>
                    <div style="font-size: 12px;">Store Address Line 2</div>
                    <div style="font-size: 12px;">Phone: (123) 456-7890</div>
                </div>
    
                <!-- Receipt Details -->
                <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0;">
                    <div style="font-size: 12px;">
                        Date: ${new Date().toLocaleString()}<br/>
                        Transaction #: ${Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
                        Customer Type: ${userType === 'reseller' ? 'Reseller' : 'Regular'}<br/>
                        Payment: ${selectedPayment}
                    </div>
                </div>
    
                <!-- Items -->
                <div style="margin: 10px 0;">
                    <div style="font-size: 12px; border-bottom: 1px dashed #000;">
                        ${selectedItems.map(item => `
                            <div style="margin: 5px 0;">
                                <div>${item.name}</div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>${item.quantity} x Rp${formatCurrency(userType === 'reseller' ? item.resellerPrice : item.regularPrice)}</span>
                                    <span>Rp${formatCurrency((userType === 'reseller' ? item.resellerPrice : item.regularPrice) * item.quantity)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
    
                <!-- Total -->
                <div style="font-size: 14px; font-weight: bold; text-align: right; margin: 10px 0;">
                    Total: Rp${formatCurrency(total)}
                </div>
    
                <!-- Footer -->
                <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                    <div>Thank you for shopping!</div>
                    <div>Please come again</div>
                    <div style="margin-top: 10px;">
                        --- ${new Date().toLocaleDateString()} ---
                    </div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        @page {
                            size: 80mm 297mm; /* Standard thermal paper size */
                            margin: 0;
                        }
                        @media print {
                            body {
                                width: 80mm;
                                margin: 0;
                                padding: 5mm;
                            }
                        }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    const handleDownload = () => {
        // Create a canvas to generate the receipt image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size for receipt
        canvas.width = 400;
        canvas.height = 800;

        // Set background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set text styles
        ctx.fillStyle = 'black';
        ctx.font = '16px "Courier New"';
        ctx.textAlign = 'center';

        // Draw store logo/name
        ctx.font = 'bold 20px "Courier New"';
        ctx.fillText('Your Store Name', canvas.width / 2, 40);

        // Draw header info
        ctx.font = '14px "Courier New"';
        ctx.fillText('Store Address Line 1', canvas.width / 2, 70);
        ctx.fillText('Store Address Line 2', canvas.width / 2, 90);
        ctx.fillText('Phone: (123) 456-7890', canvas.width / 2, 110);

        // Draw separator line
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(20, 130);
        ctx.lineTo(380, 130);
        ctx.stroke();

        // Draw transaction details
        ctx.textAlign = 'left';
        ctx.font = '14px "Courier New"';
        let y = 160;
        ctx.fillText(`Date: ${new Date().toLocaleString()}`, 30, y);
        ctx.fillText(`Transaction #: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 30, y + 20);
        ctx.fillText(`Customer Type: ${userType === 'reseller' ? 'Reseller' : 'Regular'}`, 30, y + 40);
        ctx.fillText(`Payment: ${selectedPayment}`, 30, y + 60);

        // Draw items
        y += 100;
        selectedItems.forEach(item => {
            ctx.fillText(item.name, 30, y);
            ctx.fillText(`${item.quantity} x Rp${formatCurrency(userType === 'reseller' ? item.resellerPrice : item.regularPrice)}`, 30, y + 20);
            ctx.textAlign = 'right';
            ctx.fillText(`Rp${formatCurrency((userType === 'reseller' ? item.resellerPrice : item.regularPrice) * item.quantity)}`, 370, y + 20);
            ctx.textAlign = 'left';
            y += 50;
        });

        // Draw total
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(20, y);
        ctx.lineTo(380, y);
        ctx.stroke();
        y += 30;

        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText(`Total: Rp${formatCurrency(total)}`, 370, y);

        // Draw footer
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        y += 50;
        ctx.fillText('Thank you for shopping!', canvas.width / 2, y);
        ctx.fillText('Please come again', canvas.width / 2, y + 20);
        ctx.fillText(`--- ${new Date().toLocaleDateString()} ---`, canvas.width / 2, y + 40);

        // Convert canvas to image and download
        canvas.toBlob((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${new Date().toISOString().slice(0, 10)}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 'image/png');
    };
    return (
        <div className="text-black min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Search and Filter Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                            {showSearchResults && (
                                <SearchResults
                                    results={searchResults}
                                    onSelect={addItem}
                                    userType={userType}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <select
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                            >
                                <option value="regular">Regular Customer</option>
                                <option value="reseller">Reseller</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Selected Items Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Selected Items</h2>
                    <div className="space-y-2">
                        {selectedItems.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No items selected
                            </div>
                        ) : (
                            selectedItems.map(item => (
                                <SelectedItem
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={updateQuantity}
                                    onRemove={removeItem}
                                    userType={userType}
                                />
                            ))
                        )}
                    </div>
                    <div className="mt-6 text-right">
                        <div className="text-sm text-gray-500">
                            Customer Type: {userType === 'reseller' ? 'Reseller' : 'Regular'}
                        </div>
                        <div className="text-xl font-bold">
                            Total: Rp{formatCurrency(total)}
                        </div>
                    </div>
                </div>

                {/* Payment Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        {['Cash', 'QR', 'Debit/Transfer'].map(method => (
                            <button
                                key={method}
                                className={`p-2 rounded-lg transition-colors ${selectedPayment === method
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                onClick={() => setSelectedPayment(method)}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={!selectedPayment || selectedItems.length === 0}
                            className={`w-full md:w-auto px-6 py-2 rounded-lg ${!selectedPayment || selectedItems.length === 0
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            Complete Transaction
                        </button>
                    </div>
                </div>

                {/* Transaction Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Complete Transaction</h3>
                            <p className="text-gray-600 mb-6">
                                Would you like to print or download the receipt?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleTransactionComplete('print')}
                                    disabled={selectedItems.length === 0 || !selectedPayment}
                                >
                                    Complete and Print
                                </button>
                                <button
                                    onClick={() => handleTransactionComplete('download')}
                                    disabled={selectedItems.length === 0 || !selectedPayment}
                                >
                                    Complete and Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PointOfSale;