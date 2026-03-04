"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, PackageCheck, Phone } from "lucide-react";
import { sanitizePhone, sanitizeText } from "../../../utils/sanitize";
import { API_BASE } from "../../../config/env";
import { useTheme } from "../../../context/ThemeContext";
import EditableText from "../../../components/theme/EditableText";
import { downloadOrderSlipPdf } from "../../../utils/orderSlip";

type OrderItem = {
  product?: string;
  name?: string;
  price?: number;
  quantity?: number;
  total?: number;
};

type Order = {
  _id?: string;
  orderId?: string;
  status?: string;
  orderStatus?: string;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  createdAt?: string;
  orderDate?: string;
  customer?: {
    name?: string;
    phone?: string;
  };
  items?: OrderItem[];
  summaryUrl?: string;
  summarySlipUrl?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  downloadUrl?: string;
  summaryHtml?: string;
  summarySlipHtml?: string;
  summarySlip?: string;
  receiptHtml?: string;
  invoiceHtml?: string;
  receipt?: {
    receiptId?: string;
    receiptDate?: string;
    customer?: {
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
    };
    items?: OrderItem[];
    subtotal?: number;
    totalAmount?: number;
    orderStatus?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    company?: {
      name?: string;
      phone?: string;
      email?: string;
      logo?: string;
      address?: string;
    };
  };
};

export default function OrdersPage() {
  const ORDERS_API = `${API_BASE}/v1/orders/track`;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const initializedFromQueryRef = useRef(false);
  const { theme, editMode, canManageTheme, updateTheme } = useTheme();

  const fetchOrders = useCallback(async (phoneValue: string, orderIdValue?: string) => {
    try {
      setLoading(true);
      setError("");
      setOrders([]);
      if (!phoneValue.trim()) {
        setError(theme.content.ordersPhoneRequiredError || "Please enter your phone number to view orders.");
        return [];
      }
      const params = new URLSearchParams({ phone: phoneValue.trim() });
      if (orderIdValue?.trim()) params.set("orderId", orderIdValue.trim());
      const res = await fetch(`${ORDERS_API}?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message || theme.content.ordersLoadFailedError || "Failed to load orders. Please try again.");
        return [];
      }
      const json = await res.json();
      const nextOrders = json?.data || json?.orders || [];
      const normalized = Array.isArray(nextOrders) ? nextOrders : [];
      setOrders(normalized);
      return normalized;
    } catch {
      setError(theme.content.ordersNetworkError || "Network error. Please try again.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [ORDERS_API, theme.content.ordersLoadFailedError, theme.content.ordersNetworkError, theme.content.ordersPhoneRequiredError]);

  const getStatusStyle = (status?: string) => {
    const value = (status || "pending").toLowerCase();
    if (value.includes("deliver")) return "bg-green-100 text-green-800";
    if (value.includes("ship")) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-700";
  };

  const getDownloadUrl = useCallback((order: Order) =>
    order.summarySlipUrl ||
    order.summaryUrl ||
    order.receiptUrl ||
    order.invoiceUrl ||
    order.downloadUrl, []);

  const handleDownloadUrl = useCallback((order: Order) => {
    const url = getDownloadUrl(order);
    const slipOrderId = String(order.orderId || order._id || "").trim();
    const slipPhone = (order.customer?.phone || phone || "").trim();

    (async () => {
      try {
        if (slipOrderId) {
          await downloadOrderSlipPdf(slipOrderId, slipPhone || undefined);
          return;
        }
        if (!url) return;
        if (url.toLowerCase().endsWith(".pdf")) {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.download = `zaikest-order-${order._id || "summary"}.pdf`;
          a.click();
          return;
        }
        const res = await fetch(url, { credentials: "include" });
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("pdf")) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `zaikest-order-${order._id || "summary"}.pdf`;
          a.click();
          URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {
        // fall through to direct open
      }
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = `zaikest-order-${order._id || "summary"}`;
      a.click();
    })();
  }, [getDownloadUrl, phone]);

  useEffect(() => {
    if (initializedFromQueryRef.current) return;
    initializedFromQueryRef.current = true;
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const phoneParam = sanitizePhone(params.get("phone") || "");
    const orderIdParam = sanitizeText(params.get("orderId") || "");
    const shouldDownloadSlip = (params.get("download") || "").toLowerCase() === "slip";

    if (!phoneParam) {
      setLoading(false);
      return;
    }

    setPhone(phoneParam);
    setOrderId(orderIdParam);

    (async () => {
      const fetched = await fetchOrders(phoneParam, orderIdParam);
      if (!shouldDownloadSlip || fetched.length === 0) return;
      const target = orderIdParam
        ? fetched.find(
            (order) => String(order.orderId || order._id || "") === orderIdParam
          ) || fetched[0]
        : fetched[0];
      if (!target) return;
      if (String(target.orderId || target._id || "").trim() || getDownloadUrl(target)) {
        handleDownloadUrl(target);
      }
    })();
  }, [fetchOrders, getDownloadUrl, handleDownloadUrl]);

  const formattedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...(() => {
          const itemsSubtotal = (order.items || []).reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity ?? 1),
            0
          );
          const subtotalLabel = order.subtotal ?? itemsSubtotal;
          const deliveryLabel = order.deliveryFee ?? 0;
          const totalLabel =
            order.total ??
            (order as any).totalAmount ??
            subtotalLabel + deliveryLabel;
          return { subtotalLabel, deliveryLabel, totalLabel };
        })(),
        ...order,
        createdAtLabel: order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : theme.content.ordersRecentText || "Recent",
        statusLabel:
          order.orderStatus ||
          order.status ||
          theme.content.ordersPendingText || "Pending",
      })),
    [orders, theme.content.ordersPendingText, theme.content.ordersRecentText]
  );

  return (
    <main className="relative min-h-screen py-12 px-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center animate-hero-pan"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=2000&q=80)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/70" aria-hidden />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <EditableText
            as="h1"
            className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
            value={theme.content.ordersTitle}
            fallback="View Orders"
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { ordersTitle: next } })}
          />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/90 font-semibold hover:text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
            >
              {theme.content.ordersHomeLinkText || "Home"}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-white/90 font-semibold hover:text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
            >
              {theme.content.ordersContinueShoppingText || "Continue shopping"}
            </Link>
          </div>
        </div>

      <div className="bg-white/90 border border-green-100 rounded-2xl p-5 shadow-sm mb-8">
        <EditableText
          as="p"
          className="text-sm text-[#5f6f61] mb-3"
          value={theme.content.ordersHelperText}
          fallback="Enter your phone number to fetch your orders and status updates."
          editMode={editMode && canManageTheme}
          onSave={(next) => updateTheme({ content: { ordersHelperText: next } })}
          multiline
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700" />
            <input
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              placeholder={theme.content.ordersPhonePlaceholder || "03xx-xxxxxxx"}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-green-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div className="flex-1">
            <input
              value={orderId}
              onChange={(e) => setOrderId(sanitizeText(e.target.value))}
              placeholder={theme.content.ordersOrderIdPlaceholder || "Order ID (optional)"}
              className="w-full px-4 py-3 rounded-full border border-green-100 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <button
            onClick={() => fetchOrders(phone, orderId)}
            className="px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 transition"
          >
            {editMode && canManageTheme ? (
              <EditableText
                value={theme.content.ordersButtonText}
                fallback="View Orders"
                editMode={true}
                onSave={(next) => updateTheme({ content: { ordersButtonText: next } })}
              />
            ) : (
              theme.content.ordersButtonText || "View Orders"
            )}
          </button>
        </div>
      </div>

      {loading && (
        <EditableText
          as="p"
          className="text-center text-[#5f6f61] mt-10"
          value={theme.content.ordersLoadingText}
          fallback="Loading orders..."
          editMode={editMode && canManageTheme}
          onSave={(next) => updateTheme({ content: { ordersLoadingText: next } })}
        />
      )}

      {!loading && error && (
        <div className="text-center text-red-700 mt-8">
          <p className="mb-4 text-lg font-semibold">{error}</p>
          <Link href="/" className="text-red-800 font-semibold">
            {theme.content.ordersGoBackHomeText || "Go back home"}
          </Link>
        </div>
      )}

      {!loading && !error && formattedOrders.length === 0 && (
        <div className="text-center text-[#5f6f61] mt-10">
          <EditableText
            as="p"
            value={theme.content.ordersEmptyText}
            fallback="No orders found yet."
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { ordersEmptyText: next } })}
          />
        </div>
      )}

      {!loading && !error && formattedOrders.length > 0 && (
        <div className="grid gap-6">
          {formattedOrders.map((order) => (
            <motion.div
              key={order._id || order.createdAt}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 border border-green-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#5f6f61]">{theme.content.ordersOrderLabel || "Order"}</p>
                  <p className="text-base font-semibold text-green-950">
                    #{order._id?.slice(-6) || "Zaikest"}
                  </p>
                </div>
                <div className="text-xs text-[#5f6f61]">{order.createdAtLabel}</div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                    order.statusLabel
                  )}`}
                >
                  {order.statusLabel}
                </span>
              </div>

              <div className="mt-2 text-xs text-[#5f6f61]">
                <div>
                  {theme.content.ordersBuyerLabel || "Buyer"}:{" "}
                  {order.customer?.name || theme.content.ordersCustomerFallbackText || "Customer"}
                </div>
                <div>
                  {theme.content.ordersPhoneLabel || "Phone"}: {order.customer?.phone || "--"}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-green-900">
                {(order.items || []).map((item, idx) => (
                  <div key={`${order._id}-${idx}`} className="flex justify-between">
                    <span>
                      {item.name || theme.content.ordersItemFallbackText || "Item"} x{" "}
                      {item.quantity ?? 1}
                    </span>
                    <span>PKR {(item.price || 0) * (item.quantity || 1)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-green-100 pt-3">
                <div className="text-sm text-green-950 space-y-0.5">
                  <div className="font-medium">
                    {theme.content.checkoutSubtotalLabel || "Subtotal"}: PKR {order.subtotalLabel ?? 0}
                  </div>
                  <div className="font-medium">
                    {theme.content.checkoutDeliveryLabel || "Delivery"}: PKR {order.deliveryLabel ?? 0}
                  </div>
                  <div className="font-semibold">
                    {theme.content.ordersTotalLabel || "Total"}: PKR {order.totalLabel ?? 0}
                  </div>
                </div>
                {(String(order.orderId || order._id || "").trim() || getDownloadUrl(order)) && (
                  <button
                    onClick={() => handleDownloadUrl(order)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-700 text-white text-xs font-bold hover:bg-green-800 transition"
                  >
                    <Download size={16} />
                    {theme.content.ordersDownloadReceiptText || "Download receipt"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

        <div className="mt-10 flex items-center gap-3 text-sm text-white/80">
          <PackageCheck size={18} className="text-green-300" />
          <EditableText
            value={theme.content.ordersFooterHint}
            fallback="Orders will show status updates as they move from pending to shipped and delivered."
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { ordersFooterHint: next } })}
            multiline
          />
        </div>
      </div>
    </main>
  );
}
