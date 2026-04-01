"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CheckoutContent, { type CheckoutPlacedOrderSnapshot } from "../../../components/CheckoutContent";
import { API_BASE } from "../../../config/env";
import { sanitizePhone, sanitizeText } from "../../../utils/sanitize";

export default function PurchasePage() {
  const [order, setOrder] = useState<CheckoutPlacedOrderSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sanitizeOrderId = (value: string) =>
      value
        .replace(/[^\w-]/g, "")
        .slice(0, 128);

    const load = async () => {
      try {
        const raw = window.sessionStorage.getItem("checkout:lastPlacedOrder");
        if (raw) {
          const parsed = JSON.parse(raw) as CheckoutPlacedOrderSnapshot;
          if (parsed && Array.isArray(parsed.items) && parsed.user) {
            setOrder(parsed);
            return;
          }
        }

        const orderId = sanitizeOrderId(sanitizeText(window.sessionStorage.getItem("checkout:lastOrderId") || ""));
        const phone = sanitizePhone(window.sessionStorage.getItem("checkout:lastOrderPhone") || "");
        if (!orderId || !phone) return;

        const params = new URLSearchParams({ phone, orderId });
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        try {
          const res = await fetch(`${API_BASE}/v1/orders/track?${params.toString()}`, {
            credentials: "include",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const json = await res.json().catch(() => null);
          const orders = (json?.data || json?.orders || []) as any[];
          const match = Array.isArray(orders)
            ? orders.find((o) => String(o?._id || o?.orderId || "").trim() === orderId) || orders[0]
            : null;
          if (!match) return;

          const items = Array.isArray(match.items)
            ? match.items.map((item: any) => ({
                _id: String(item?.product || item?._id || item?.id || item?.sku || item?.name || ""),
                name: String(item?.name || "Item"),
                price: Number(item?.price || 0),
                quantity: Number(item?.quantity || 0),
              }))
            : [];

          const snapshot: CheckoutPlacedOrderSnapshot = {
            items,
            subtotal: Number(match.subtotal || 0),
            deliveryFee: Number(match.deliveryFee || 0),
            total: Number(match.total || match.totalAmount || 0),
            user: {
              name: String(match.customer?.name || ""),
              email: "",
              phone: String(match.customer?.phone || phone),
              address: String(match.customer?.address || ""),
              id: "",
            },
            serverOrder: match,
            downloadUrl:
              match.summarySlipUrl ||
              match.summaryUrl ||
              match.receiptUrl ||
              match.invoiceUrl ||
              match.downloadUrl,
          };

          setOrder(snapshot);
        } finally {
          window.clearTimeout(timeoutId);
        }
      } catch {
        // ignore
      }
    };

    load().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-green-700/25 border-t-green-800 animate-spin" />
          <div className="text-base font-semibold text-gray-900">Loading your order...</div>
          <div className="mt-1 text-sm text-gray-600">Please wait a moment</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4 py-10 sm:px-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-gray-900">Order not found</h1>
          <p className="mt-2 text-sm text-gray-700">
            Your receipt isn&apos;t available in this tab. You can still view your orders.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-green-700 px-6 py-3 text-white font-semibold hover:bg-green-800 transition"
            >
              View Orders
            </Link>
            <Link
              href="/checkout"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-gray-900 font-semibold hover:border-gray-400 transition"
            >
              Back to Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CheckoutContent
      variant="page"
      initialPlacedOrder={order}
      trackPurchase={true}
      successRedirectPath="/purchase"
    />
  );
}
