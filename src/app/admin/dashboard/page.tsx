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
const ORDERS_API = `${API_BASE}/v1/admin/orders`;

type OrderItem = {
  quantity?: number;
  price?: number;
};

type Order = {
  orderStatus?: string;
  status?: string;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  orderDate?: string;
  createdAt?: string;
  items?: OrderItem[];
};

export default function AdminDashboard() {
  const [totals, setTotals] = useState<SummaryTotals>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [timeframe, setTimeframe] = useState<
    "day" | "week" | "month" | "year" | "all"
  >("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError("");
        const res = await fetch(SUMMARY_API, { credentials: "include" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setSummaryError(json?.message || "Failed to load dashboard summary.");
          return;
        }
        const json = await res.json();
        setTotals(json?.totals || {});
      } catch {
        setSummaryError("Network error. Please try again.");
      } finally {
        setSummaryLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError("");
        const res = await fetch(ORDERS_API, { credentials: "include" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setOrdersError(json?.message || "Failed to load orders.");
          return;
        }
        const json = await res.json();
        const extracted = json?.orders || json?.data?.orders || json?.data || [];
        setOrders(Array.isArray(extracted) ? extracted : [extracted]);
      } catch {
        setOrdersError("Network error. Please try again.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchSummary();
    fetchOrders();
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: totals.users ?? 0,
      accent: "text-blue-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M16 19a4 4 0 0 0-8 0" />
          <circle cx="12" cy="9" r="3.5" />
        </svg>
      ),
    },
    {
      label: "Total Products",
      value: totals.products ?? 0,
      accent: "text-emerald-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
          <path d="M4 7l4-3h8l4 3" />
        </svg>
      ),
    },
    {
      label: "Total Orders",
      value: totals.orders ?? 0,
      accent: "text-amber-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-amber-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M6 7h12l1 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      ),
    },
    {
      label: "Sales",
      value: totals.sales ?? 0,
      suffix: " PKR",
      accent: "text-purple-700",
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-purple-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 12h16" />
          <path d="M8 8l-4 4 4 4" />
          <path d="M16 8l4 4-4 4" />
        </svg>
      ),
    },
  ];

  const chartMetric = "Delivered Sales (PKR)";

  const getValue = (item: SummaryBarItem) => item.totalSales || 0;

  const parseDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const monthShort = (date: Date) =>
    date.toLocaleString("en-US", { month: "short" });

  const formatDate = (date: Date) => {
    const day = date.getDate();
    return `${day} ${monthShort(date)} ${date.getFullYear()}`;
  };

  const formatMonth = (date: Date) =>
    `${monthShort(date)} ${date.getFullYear()}`;

  const formatYear = (date: Date) => `${date.getFullYear()}`;

  const startOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfMonth = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const formatWeek = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()} ${monthShort(start)}-${end.getDate()} ${monthShort(
      end
    )} ${end.getFullYear()}`;
  };

  const formatIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const endOfMonth = (date: Date) => {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(0, 0, 0, 0);
    return end;
  };

  const endOfYear = (date: Date) => {
    const end = new Date(date.getFullYear(), 11, 31);
    end.setHours(0, 0, 0, 0);
    return end;
  };

  const getOrderStatus = (order: Order) =>
    (order.orderStatus || order.status || "").toLowerCase();

  const getOrderAmount = (order: Order) => {
    if (typeof order.totalAmount === "number") return order.totalAmount;
    if (typeof order.total === "number") return order.total;
    const subtotal =
      order.subtotal ??
      (order.items || []).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      );
    return subtotal + (order.deliveryFee ?? 0);
  };

  const deliveredDaily = (() => {
    const buckets = new Map<
      string,
      { date: string; totalSales: number; count: number; _sort: number }
    >();
    orders.forEach((order, index) => {
      if (getOrderStatus(order) !== "delivered") return;
      const dateValue = order.orderDate || order.createdAt;
      const date = parseDate(dateValue);
      if (!date) return;
      const iso = formatIsoDate(date);
      const amount = getOrderAmount(order);
      const sortValue = date.getTime();
      const entry = buckets.get(iso) || {
        date: iso,
        totalSales: 0,
        count: 0,
        _sort: sortValue,
      };
      entry.totalSales += amount;
      entry.count += 1;
      entry._sort = Math.min(entry._sort, sortValue);
      buckets.set(iso, entry);
    });
    return Array.from(buckets.values()).sort((a, b) => a._sort - b._sort);
  })();

  const resolveDateRange = (
    fallbackItems: SummaryBarItem[],
    options?: { days?: number; weeks?: number; months?: number; years?: number }
  ) => {
    if (fallbackItems.length === 0) return null;
    const toDate = (iso: string) => new Date(`${iso}T00:00:00`);
    const max = new Date();
    if (options?.days) {
      const min = new Date(max);
      min.setDate(max.getDate() - (options.days - 1));
      min.setHours(0, 0, 0, 0);
      return { min, max };
    }
    if (options?.weeks) {
      const maxWeekStart = startOfWeek(max);
      const min = new Date(maxWeekStart);
      min.setDate(maxWeekStart.getDate() - (options.weeks - 1) * 7);
      return { min, max: maxWeekStart };
    }
    if (options?.months) {
      const maxMonthStart = startOfMonth(max);
      const min = new Date(maxMonthStart);
      min.setMonth(maxMonthStart.getMonth() - (options.months - 1));
      return { min, max: maxMonthStart };
    }
    if (options?.years) {
      const min = new Date(max.getFullYear() - (options.years - 1), 0, 1);
      min.setHours(0, 0, 0, 0);
      return { min, max };
    }
    return {
      min: toDate(fallbackItems[0].date || ""),
      max,
    };
  };

  const fillDaily = (items: SummaryBarItem[], days?: number) => {
    if (items.length === 0) return [];
    const range = resolveDateRange(items, days ? { days } : undefined);
    if (!range) return [];
    const { min, max } = range;
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const iso = formatIsoDate(cursor);
      const existing = map.get(iso);
      filled.push(
        existing
          ? { ...existing, date: formatDate(cursor) }
          : { date: formatDate(cursor), totalSales: 0, count: 0 }
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    return filled;
  };

  const fillDailyInRange = (
    items: SummaryBarItem[],
    min: Date,
    max: Date
  ) => {
    if (items.length === 0) return [];
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const iso = formatIsoDate(cursor);
      const existing = map.get(iso);
      filled.push(
        existing
          ? { ...existing, date: formatDate(cursor) }
          : { date: formatDate(cursor), totalSales: 0, count: 0 }
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    return filled;
  };

  const fillMonthlyInRange = (
    items: SummaryBarItem[],
    min: Date,
    max: Date
  ) => {
    if (items.length === 0) return [];
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(startOfMonth(min));
    const end = startOfMonth(max);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const existing = map.get(key);
      filled.push(
        existing
          ? { ...existing, date: formatMonth(cursor) }
          : { date: formatMonth(cursor), totalSales: 0, count: 0 }
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return filled;
  };

  const fillWeekly = (items: SummaryBarItem[], weeks?: number) => {
    if (items.length === 0) return [];
    const range = resolveDateRange(items, weeks ? { weeks } : undefined);
    if (!range) return [];
    const min = startOfWeek(range.min);
    const max = startOfWeek(range.max);
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const iso = formatIsoDate(cursor);
      const existing = map.get(iso);
      filled.push(
        existing
          ? { ...existing, date: formatWeek(cursor) }
          : { date: formatWeek(cursor), totalSales: 0, count: 0 }
      );
      cursor.setDate(cursor.getDate() + 7);
    }
    return filled;
  };

  const fillMonthly = (items: SummaryBarItem[], months?: number) => {
    if (items.length === 0) return [];
    const range = resolveDateRange(items, months ? { months } : undefined);
    if (!range) return [];
    const min = startOfMonth(range.min);
    const max = startOfMonth(range.max);
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const existing = map.get(iso);
      filled.push(
        existing
          ? { ...existing, date: formatMonth(cursor) }
          : { date: formatMonth(cursor), totalSales: 0, count: 0 }
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return filled;
  };

  const fillYearly = (items: SummaryBarItem[], years?: number) => {
    if (items.length === 0) return [];
    const range = resolveDateRange(items, years ? { years } : undefined);
    if (!range) return [];
    const min = startOfYear(range.min);
    const max = startOfYear(range.max);
    const map = new Map(items.map((item) => [item.date, item]));
    const filled: SummaryBarItem[] = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const yearKey = String(cursor.getFullYear());
      const existing = map.get(yearKey);
      filled.push(
        existing
          ? { ...existing, date: formatYear(cursor) }
          : { date: formatYear(cursor), totalSales: 0, count: 0 }
      );
      cursor.setFullYear(cursor.getFullYear() + 1);
    }
    return filled;
  };

  const chartData = (() => {
    if (deliveredDaily.length === 0) return [];

    const anchor = new Date(anchorDate);
    anchor.setHours(0, 0, 0, 0);

    if (timeframe === "day") {
      const max = new Date(anchor);
      const min = new Date(anchor);
      min.setDate(max.getDate() - 6);
      return fillDailyInRange(deliveredDaily, min, max);
    }

    if (timeframe === "week") {
      const min = startOfWeek(anchor);
      const max = new Date(min);
      max.setDate(min.getDate() + 6);
      return fillDailyInRange(deliveredDaily, min, max);
    }

    if (timeframe === "month") {
      const min = startOfMonth(anchor);
      const max = endOfMonth(anchor);
      return fillDailyInRange(deliveredDaily, min, max);
    }

    if (timeframe === "year") {
      const min = startOfYear(anchor);
      const max = endOfYear(anchor);
      const buckets = new Map<
        string,
        { date: string; totalSales: number; count: number; _sort: number }
      >();
      deliveredDaily.forEach((item) => {
        const date = new Date(`${item.date}T00:00:00`);
        if (date < min || date > max) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entry = buckets.get(key) || {
          date: key,
          totalSales: 0,
          count: 0,
          _sort: startOfMonth(date).getTime(),
        };
        entry.totalSales += item.totalSales || 0;
        entry.count += item.count || 0;
        entry._sort = Math.min(entry._sort, startOfMonth(date).getTime());
        buckets.set(key, entry);
      });
      const monthly = Array.from(buckets.values()).sort((a, b) => a._sort - b._sort);
      return fillMonthlyInRange(monthly, min, max);
    }

    return fillDaily(deliveredDaily);
  })();
  const chartMinWidth = Math.max(chartData.length, 7) * 72;
  const barColors = [
    "#0f172a",
    "#1e293b",
    "#334155",
    "#475569",
    "#64748b",
    "#0b5563",
    "#0e7490",
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Overview of store performance and activity.
            </p>
          </div>
          <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
            {summaryLoading ? "Syncing latest data..." : "Live data"}
          </div>
        </div>
      </div>

      {summaryError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {summaryError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {card.label}
              </p>
              <span className="rounded-full bg-slate-100/70 p-2">
                {card.icon}
              </span>
            </div>
            <div className="mt-4">
              {summaryLoading ? (
                <p className="text-lg font-semibold text-slate-400">
                  Loading...
                </p>
              ) : (
                <p className={`text-2xl font-semibold ${card.accent}`}>
                  {card.value.toLocaleString()}
                  {card.suffix || ""}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Compared to last refresh
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-100 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Sales Overview
            </h2>
            <p className="text-xs text-slate-600">{chartMetric}</p>
          </div>
          {ordersError ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
              {ordersError}
            </span>
          ) : null}
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-100/70 px-2 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (timeframe === "day") {
                  setAnchorDate((prev) => {
                    const next = new Date(prev);
                    next.setDate(next.getDate() - 7);
                    return next;
                  });
                } else if (timeframe === "week") {
                  setAnchorDate((prev) => {
                    const next = new Date(prev);
                    next.setDate(next.getDate() - 7);
                    return next;
                  });
                } else if (timeframe === "month") {
                  setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                } else if (timeframe === "year") {
                  setAnchorDate((prev) => new Date(prev.getFullYear() - 1, 0, 1));
                }
              }}
              disabled={timeframe === "all"}
              className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => {
                if (timeframe === "day") {
                  setAnchorDate((prev) => {
                    const next = new Date(prev);
                    next.setDate(next.getDate() + 7);
                    return next;
                  });
                } else if (timeframe === "week") {
                  setAnchorDate((prev) => {
                    const next = new Date(prev);
                    next.setDate(next.getDate() + 7);
                    return next;
                  });
                } else if (timeframe === "month") {
                  setAnchorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                } else if (timeframe === "year") {
                  setAnchorDate((prev) => new Date(prev.getFullYear() + 1, 0, 1));
                }
              }}
              disabled={timeframe === "all"}
              className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            {(["day", "week", "month", "year", "all"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTimeframe(option)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  timeframe === option
                    ? "border-slate-700 bg-slate-700 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {option === "day"
                  ? "Daily"
                  : option === "week"
                  ? "Weekly"
                  : option === "month"
                  ? "Monthly"
                  : option === "year"
                  ? "Yearly"
                  : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          {ordersLoading ? (
            <p className="text-sm text-slate-500">Loading chart...</p>
          ) : ordersError ? (
            <p className="text-sm text-red-600">{ordersError}</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-slate-500">
              No delivered sales available.
            </p>
          ) : (
            <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                <span>Peak {chartMetric}</span>
                <span>
                  {Math.max(
                    0,
                    ...chartData.map((b) => getValue(b))
                  ).toLocaleString()}
                </span>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  Delivered sales
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  Zero sales
                </span>
              </div>
              <div className="overflow-x-auto">
                <div
                  className="flex items-end justify-between gap-3"
                  style={{ minWidth: `${chartMinWidth}px` }}
                >
                {(() => {
                  const values = chartData.map((b) => getValue(b));
                  const maxValue = Math.max(1, ...values);
                  return chartData.map((item, index) => {
                    const value = getValue(item);
                    const height = (value / maxValue) * 100;
                    const isZero = value === 0;
                    const safeHeight = isZero ? 2 : height;
                    return (
                      <div
                        key={`${item.date || "day"}-${index}`}
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <div
                          className="relative flex w-full max-w-[48px] flex-col items-center justify-end h-44 rounded-lg bg-[#f1f5f9] bg-[linear-gradient(to_top,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[length:100%_28px]"
                          title={String(value)}
                        >
                          <div
                            className="w-4 sm:w-5 md:w-6 rounded-t-md shadow-sm transition hover:brightness-110"
                            style={{
                              height: `${safeHeight}%`,
                              backgroundColor:
                                isZero ? "#cbd5e1" : barColors[index % barColors.length],
                              border: isZero ? "1px solid #94a3b8" : "none",
                            }}
                          />
                        </div>
                        <div className="mt-2 text-center text-xs font-medium text-slate-700">
                          {`PKR ${value.toLocaleString()}`}
                        </div>
                        <div className="mt-1 text-center text-[10px] text-slate-400">
                          {item.date || "--"}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



