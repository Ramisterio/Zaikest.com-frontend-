"use client";

import { useEffect, useState } from "react";
import { useCart } from "../../../context/CartContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, MapPin, Phone } from "lucide-react";
import PromoPosters from "../../../components/PromoPosters";
import { sanitizeAddress, sanitizeEmail, sanitizePhone, sanitizeText } from "../../../utils/sanitize";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../config/env";
import { resolvePublicUrl } from "../../../utils/url";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user: authUser } = useAuth();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 0 : 0;
  const totalPrice = subtotal + deliveryFee;
  const ORDERS_API = `${API_BASE}/v1/orders`;

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    id: "",
  });

  useEffect(() => {
    if (!authUser) return;
    setUser((prev) => ({
      ...prev,
      name: authUser.name || prev.name,
      email: authUser.email || prev.email,
      id: authUser.id || prev.id,
    }));
  }, [authUser]);

  const [error, setError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    items: typeof cart;
    subtotal: number;
    deliveryFee: number;
    total: number;
    user: typeof user;
    serverOrder?: unknown;
    downloadUrl?: string;
    summaryHtml?: string;
  } | null>(null);

  const handleDownloadReceipt = async () => {
    if (!placedOrder) return;
    const serverDownloadUrl = placedOrder.downloadUrl;
    const serverSummaryHtml = placedOrder.summaryHtml;

    if (serverDownloadUrl) {
      const a = document.createElement("a");
      a.href = serverDownloadUrl;
      a.download = "zaikest-order-summary";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      return;
    }

    const orderJson: any = placedOrder.serverOrder;
    let html = "";

    if (orderJson) {
      const publicLogo = resolvePublicUrl("/images/zaikest-logo.png");
      html = buildSlipFromOrderJson(orderJson, publicLogo);
    } else {
      html = serverSummaryHtml || "";
    }

    if (html) {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zaikest-order-summary.html";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    setError("Order slip is not available from the server yet.");
    return;
  };

  const buildSlipFromOrderJson = (order: any, logoOverride?: string) => {
    if (!order) return "";
    const logoSrc = logoOverride || resolvePublicUrl("/images/zaikest-logo.png");
    const orderDate = order.orderDate
      ? new Date(order.orderDate).toLocaleString()
      : new Date().toLocaleString();

    const rows = (order.items || [])
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">PKR ${item.total ?? item.price * item.quantity}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${order.company?.name || "Zaikest"} Order Summary</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 24px; color: #111827;">
          <div style="max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logoSrc ? `<img src="${logoSrc}" alt="${order.company?.name || "Zaikest"}" style="width: 48px; height: 48px; object-fit: contain;" />` : ""}
                <div>
                  <div style="font-size: 20px; font-weight: 700;">${order.company?.name || "Zaikest"}</div>
                  <div style="font-size: 12px; color: #6b7280;">Order Summary Slip</div>
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div>${orderDate}</div>
                <div>Order ID: ${order.orderId || ""}</div>
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; margin-bottom: 6px;">Customer</div>
              <div>${order.customer?.name || ""}</div>
              <div>${order.customer?.phone || ""}</div>
              <div>${order.customer?.address || ""}</div>
              <div>${order.customer?.city || ""}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="text-align: center; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 14px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px;">
                <span>Total</span>
                <span>PKR ${order.totalAmount ?? 0}</span>
              </div>
            </div>

            <div style="margin-top: 18px; font-size: 12px; color: #6b7280; text-align: center;">
              <div>Contact: ${order.company?.email || ""} | ${order.company?.phone || ""}</div>
              <div>${order.company?.address || ""}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePlaceOrder = async () => {
    setError("");
    if (
      !user.name.trim() ||
      !user.email.trim() ||
      !user.phone.trim() ||
      !user.address.trim()
    ) {
      setError("Please fill all required fields.");
      return;
    }
    if (!/karachi/i.test(user.address)) {
      setError("Delivery address must be within Karachi");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    const orderPayload = {
      items: cart.map((item) => ({
        product: item._id,
        quantity: item.quantity,
      })),
      customer: {
        name: user.name,
        phone: user.phone,
        address: user.address,
        email: user.email,
        userId: user.id,
      },
    };

    try {
      setIsPlacingOrder(true);
      setError("");
      const res = await fetch(ORDERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const message =
          errJson?.message ||
          errJson?.error ||
          errJson?.data?.message ||
          "Failed to place order. Please try again.";
        setError(message);
        return;
      }

      const data = await res.json().catch(() => ({} as { data?: unknown }));
      const serverData: any = data?.data ?? data;
      const orderJson = serverData?.order;
      const downloadUrl =
        serverData?.summaryUrl ||
        serverData?.receiptUrl ||
        serverData?.invoiceUrl ||
        serverData?.downloadUrl;
      const summaryHtml =
        serverData?.summaryHtml ||
        serverData?.receiptHtml ||
        serverData?.invoiceHtml ||
        buildSlipFromOrderJson(orderJson, resolvePublicUrl("/images/zaikest-logo.png"));

      const orderSnapshot = {
        items: cart,
        subtotal,
        deliveryFee,
        total: totalPrice,
        user,
        serverOrder: serverData,
        downloadUrl,
        summaryHtml,
      };

      setOrderPlaced(true);
      setPlacedOrder(orderSnapshot);
      clearCart();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-green-950">Your cart is empty</h1>
        <Link href="/products" className="text-green-700 hover:text-green-800 mt-4 inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <motion.div
        className="max-w-4xl mx-auto py-12 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white/90 border border-green-100 shadow-2xl rounded-3xl p-8 text-center">
          <motion.h1
            className="text-3xl font-bold text-green-700 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Order Confirmed
          </motion.h1>

          <p className="text-[#5f6f61] mb-6">
            Thank you for shopping with <span className="font-semibold">Zaikest</span>
          </p>

          <div className="text-left bg-green-50 rounded-2xl p-4 mb-5">
            <p><strong>Name:</strong> {placedOrder?.user.name}</p>
            <p><strong>Email:</strong> {placedOrder?.user.email}</p>
            <p><strong>Phone:</strong> {placedOrder?.user.phone}</p>
            <p><strong>Address:</strong> {placedOrder?.user.address}</p>
          </div>

          <div className="text-left space-y-2 mb-4">
            {placedOrder?.items.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>PKR {item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="text-left text-sm text-[#5f6f61] border-t border-green-100 pt-3 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>PKR {placedOrder?.subtotal ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{placedOrder?.deliveryFee ? `PKR ${placedOrder.deliveryFee}` : "Free"}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-green-100 pt-3 mb-6">
            <span>Total</span>
            <span>PKR {placedOrder?.total ?? 0}</span>
          </div>

          <Link
            href="/products"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-full hover:bg-green-800 transition"
          >
            Continue Shopping
          </Link>

          <button
            onClick={handleDownloadReceipt}
            className="ml-3 inline-block bg-white border border-green-200 text-green-900 px-6 py-3 rounded-full font-semibold hover:border-green-400 transition"
          >
            Download Summary Slip
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-5xl mx-auto py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-green-950">Checkout</h1>

      {error && (
        <p className="text-green-600 mb-4 text-center font-semibold">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/90 border border-green-100 shadow-lg rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-xl border-b border-green-100 pb-2">Delivery Details</h2>

          <label className="text-sm font-medium text-green-900">Full name</label>
          <input
            value={user.name}
            onChange={(e) =>
              setUser({ ...user, name: sanitizeText(e.target.value) })
            }
            className="w-full border border-green-100 rounded-lg px-3 py-2 bg-green-50"
            disabled={isPlacingOrder}
            required
          />

          <label className="text-sm font-medium text-green-900">Email address</label>
          <input
            value={user.email}
            onChange={(e) =>
              setUser({ ...user, email: sanitizeEmail(e.target.value) })
            }
            className="w-full border border-green-100 rounded-lg px-3 py-2 bg-green-50"
            disabled={isPlacingOrder}
            required
          />

          <label className="text-sm font-medium text-green-900 flex items-center gap-2">
            <Phone size={16} />
            Phone number
          </label>
          <input
            placeholder="Enter phone number"
            value={user.phone}
            onChange={(e) => setUser({ ...user, phone: sanitizePhone(e.target.value) })}
            className="w-full border border-green-100 rounded-lg px-3 py-2"
            disabled={isPlacingOrder}
            required
          />

          <label className="text-sm font-medium text-green-900 flex items-center gap-2">
            <MapPin size={16} />
            Delivery address
          </label>
          <textarea
            placeholder="Enter delivery address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: sanitizeAddress(e.target.value) })}
            className="w-full border border-green-100 rounded-lg px-3 py-2 min-h-[110px]"
            disabled={isPlacingOrder}
            required
          />
        </div>

        <div className="bg-white/90 border border-green-100 shadow-lg rounded-2xl p-6">
          <h2 className="font-semibold text-xl border-b border-green-100 pb-2 mb-4">Order Summary</h2>

          {cart.map((item) => (
            <div key={item._id} className="flex justify-between mb-2 text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>PKR {item.price * item.quantity}</span>
            </div>
          ))}

          <div className="flex justify-between text-sm text-[#5f6f61] mt-4">
            <span>Subtotal</span>
            <span>PKR {subtotal}</span>
          </div>

          <div className="flex justify-between text-sm text-[#5f6f61] mt-2">
            <span>Delivery</span>
            <span>{deliveryFee ? `PKR ${deliveryFee}` : "Free"}</span>
          </div>

          <div className="flex justify-between font-bold text-lg border-t border-green-100 pt-3 mt-4">
            <span>Total</span>
            <span>PKR {totalPrice}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="mt-6 w-full bg-green-700 text-white py-3 rounded-full font-semibold hover:bg-green-800 transition inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isPlacingOrder}
          >
            <CreditCard size={18} />
            {isPlacingOrder ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                Placing...
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <PromoPosters />
      </div>
    </motion.div>
  );
}

