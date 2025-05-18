'use client'

import { useState, useEffect, useCallback } from 'react'
import { addDays, format } from 'date-fns'
import axios from 'axios'

export default function SalesReportPage() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [date, setDate] = useState({
        from: new Date(),
        to: addDays(new Date(), 7),
    })
    const [customerType, setCustomerType] = useState('all')
    const [paymentType, setPaymentType] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Memoize fetchSalesReport to prevent unnecessary recreations
    const fetchSalesReport = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                startDate: date.from.toISOString(),
                endDate: date.to.toISOString(),
                customerType,
                paymentType,
                search: searchQuery.trim(),
            })

            const response = await axios.get(`http://localhost:3033/api/reports/sales?${params}`)

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = response.data
            setSales(data)
        } catch (error) {
            console.error('Error fetching sales report:', error)
            setError('Failed to load sales data. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [date, customerType, paymentType, searchQuery])

    useEffect(() => {
        fetchSalesReport()
    }, [fetchSalesReport])

    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
    const totalItems = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0)

    return (
        <div className="p-6 bg-white text-black">
            <h1 className="text-2xl font-bold mb-6">Laporan Penjualan</h1>

            <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                    <h2 className="text-lg font-bold mb-4">Filter</h2>
                    <div className="flex flex-wrap gap-4">
                        <input
                            type="date"
                            value={format(date.from, 'yyyy-MM-dd')}
                            onChange={(e) => setDate({ ...date, from: new Date(e.target.value) })}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                            type="date"
                            value={format(date.to, 'yyyy-MM-dd')}
                            onChange={(e) => setDate({ ...date, to: new Date(e.target.value) })}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        />

                        <select
                            value={customerType}
                            onChange={(e) => setCustomerType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="all">Semua</option>
                            <option value="regular">Regular</option>
                            <option value="reseller">Reseller</option>
                        </select>

                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="all">Semua</option>
                            <option value="cash">Tunai</option>
                            <option value="transfer">Transfer</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        />

                        <button
                            onClick={fetchSalesReport}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Terapkan Filter'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h2 className="text-lg font-bold">Total Pendapatan</h2>
                        <p className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <h2 className="text-lg font-bold">Total Item Terjual</h2>
                        <p className="text-2xl font-bold">{totalItems.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <h2 className="text-lg font-bold mb-4">Rincian Penjualan</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 uppercase text-xs">
                                <tr>
                                    <th className="px-3 py-3 text-left">Tanggal</th>
                                    <th className="px-3 py-3 text-left">Produk</th>
                                    <th className="px-3 py-3 text-right">Qty</th>
                                    <th className="px-3 py-3 text-right">Total</th>
                                    <th className="px-3 py-3 text-left">Tipe Pelanggan</th>
                                    <th className="px-3 py-3 text-left">Pembayaran</th>
                                    <th className="px-3 py-3 text-left">Kasir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td className="px-3 py-3">
                                            {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-3 py-3">{sale.productName}</td>
                                        <td className="px-3 py-3 text-right">{sale.quantity}</td>
                                        <td className="px-3 py-3 text-right">
                                            Rp {sale.totalPrice.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-3 py-3">{sale.customerType}</td>
                                        <td className="px-3 py-3">{sale.paymentType}</td>
                                        <td className="px-3 py-3">{sale.cashierName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}