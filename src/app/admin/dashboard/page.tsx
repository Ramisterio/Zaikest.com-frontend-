"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../../../config/env";

type SummaryTotals = {
  sales?: number;
  orders?: number;
  products?: number;
  stock?: number;
  users?: number;
};

type SummaryBarItem = {
  date?: string;
  totalSales?: number;
  count?: number;
};

const SUMMARY_API = `${API_BASE}/v1/admin/dashboard/summary`;

export default function AdminDashboard() {
  const [totals, setTotals] = useState<SummaryTotals>({});
  const [bar, setBar] = useState<SummaryBarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(SUMMARY_API, { credentials: "include" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setError(json?.message || "Failed to load dashboard summary.");
          return;
        }
        const json = await res.json();
        setTotals(json?.totals || {});
        setBar(Array.isArray(json?.bar) ? json.bar : []);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 bg-white shadow rounded">
          <p className="text-gray-500">Total Users</p>
          {loading ? (
            <p className="text-xl font-semibold">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-xl font-semibold">
              {(totals.users ?? 0).toLocaleString()}
            </p>
          )}
        </div>
        <div className="p-6 bg-white shadow rounded">
          <p className="text-gray-500">Total Products</p>
          {loading ? (
            <p className="text-xl font-semibold">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-xl font-semibold">
              {(totals.products ?? 0).toLocaleString()}
            </p>
          )}
        </div>
        <div className="p-6 bg-white shadow rounded">
          <p className="text-gray-500">Total Orders</p>
          {loading ? (
            <p className="text-xl font-semibold">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-xl font-semibold">
              {(totals.orders ?? 0).toLocaleString()}
            </p>
          )}
        </div>
        <div className="p-6 bg-white shadow rounded">
          <p className="text-gray-500">Sales</p>
          {loading ? (
            <p className="text-xl font-semibold">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-xl font-semibold">
              {(totals.sales ?? 0).toLocaleString()} PKR
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
        </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading chart...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : bar.length === 0 ? (
        <p className="text-sm text-gray-500">No data available.</p>
      ) : (
        <div className="flex items-end gap-4 h-48">
          {(() => {
            const values = bar.map((b) =>
              (b.totalSales || 0) > 0 ? b.totalSales || 0 : b.count || 0
            );
            const maxValue = Math.max(1, ...values);
            return bar.map((item, index) => {
              const value =
                (item.totalSales || 0) > 0
                  ? item.totalSales || 0
                  : item.count || 0;
              const height = (value / maxValue) * 100;
              return (
                <div key={`${item.date || "day"}-${index}`} className="flex-1">
                  <div className="flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full bg-green-600 rounded-t"
                      style={{ height: `${height}%` }}
                      title={String(value)}
                    />
                  </div>
                  <div className="text-center text-xs text-gray-600 mt-2">
                    {value}
                  </div>
                  <div className="text-center text-[10px] text-gray-400">
                    {item.date || "--"}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
