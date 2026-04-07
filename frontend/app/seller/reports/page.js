'use client';
import { useState, useEffect } from 'react';
import { sellerAPI } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SellerReportsPage() {
  const [report, setReport] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sellerAPI.getRevenueReport({ year }).then((res) => {
      const filled = MONTHS.map((m, i) => {
        const data = res.data.report.find((r) => r._id.month === i + 1);
        return { month: m, revenue: data?.revenue || 0, orders: data?.orders || 0, units: data?.unitsSold || 0 };
      });
      setReport(filled);
    }).finally(() => setLoading(false));
  }, [year]);

  const totalRevenue = report.reduce((sum, r) => sum + r.revenue, 0);
  const totalOrders = report.reduce((sum, r) => sum + r.orders, 0);
  const totalUnits = report.reduce((sum, r) => sum + r.units, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-auto">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'text-green-600' },
          { label: 'Total Orders', value: totalOrders, color: 'text-blue-600' },
          { label: 'Units Sold', value: totalUnits, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-card p-5 text-center">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Revenue — {year}</h3>
          {loading ? <div className="skeleton h-[250px] rounded" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={report}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Orders & Units — {year}</h3>
          {loading ? <div className="skeleton h-[250px] rounded" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={report}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" dot={false} />
                <Line type="monotone" dataKey="units" stroke="#10b981" strokeWidth={2} name="Units" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
