"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../../../config/env";

type SummaryTotals = {
  stock?: number;
};

const SUMMARY_API = `${API_BASE}/v1/admin/dashboard/summary`;

export default function StockPage() {
  const [totals, setTotals] = useState<SummaryTotals>({});
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
          setError(json?.message || "Failed to load stock totals.");
          return;
        }
        const json = await res.json();
        setTotals(json?.totals || {});
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow rounded">
          <p className="text-gray-500">Total Stock Units</p>
          {loading ? (
            <p className="text-xl font-semibold">Loading...</p>
          ) : (
            <p className="text-xl font-semibold">
              {(totals.stock ?? 0).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
