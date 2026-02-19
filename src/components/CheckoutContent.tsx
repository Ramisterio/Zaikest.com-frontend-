"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, MapPin, Phone } from "lucide-react";
import PromoPosters from "./PromoPosters";
import { sanitizeAddress, sanitizeEmail, sanitizePhone, sanitizeText } from "../utils/sanitize";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config/env";
import { resolvePublicUrl } from "../utils/url";

export default function CheckoutContent({
  variant = "page",
  onRequestClose,
}: {
  variant?: "page" | "modal";
  onRequestClose?: () => void;
}) {
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
  const [success, setSuccess] = useState("");
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

  // No auto-close for modal; user closes via button.

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

    const publicLogo = resolvePublicUrl("/images/zaikest-logo.png");
    if (orderJson) {
      html = buildSlipFromOrderJson(orderJson, publicLogo);
    }
    if (!html) {
      html = buildSlipFromSnapshot(placedOrder, publicLogo);
    }
    if (!html) {
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
  };

  const buildSlipFromOrderJson = (order: any, logoOverride?: string) => {
    if (!order) return "";
    const payload = order?.order ?? order;
    const logoSrc = logoOverride || resolvePublicUrl("/images/zaikest-logo.png");
    const orderDate = payload.orderDate
      ? new Date(payload.orderDate).toLocaleString()
      : new Date().toLocaleString();

    const items = Array.isArray(payload.items) ? payload.items : [];
    const rows = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">PKR ${item.total ?? (item.price * item.quantity)}</td>
          </tr>
        `
      )
      .join("");

    const computedTotal =
      payload.totalAmount ??
      payload.total ??
      payload.subtotal ??
      items.reduce(
        (sum: number, item: any) => sum + (item.total ?? (item.price * item.quantity)),
        0
      );

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${payload.company?.name || "Zaikest"} Order Summary</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 24px; color: #111827;">
          <div style="max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logoSrc ? `<img src="${logoSrc}" alt="${payload.company?.name || "Zaikest"}" style="width: 48px; height: 48px; object-fit: contain;" />` : ""}
                <div>
                  <div style="font-size: 20px; font-weight: 700;">${payload.company?.name || "Zaikest"}</div>
                  <div style="font-size: 12px; color: #6b7280;">Order Summary Slip</div>
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div>${orderDate}</div>
                <div>Order ID: ${payload.orderId || ""}</div>
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; margin-bottom: 6px;">Customer</div>
              <div>${payload.customer?.name || ""}</div>
              <div>${payload.customer?.phone || ""}</div>
              <div>${payload.customer?.address || ""}</div>
              <div>${payload.customer?.city || ""}</div>
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
                <span>PKR ${computedTotal ?? 0}</span>
              </div>
            </div>

            <div style="margin-top: 18px; font-size: 12px; color: #6b7280; text-align: center;">
              <div>Contact: ${payload.company?.email || ""} | ${payload.company?.phone || ""}</div>
              <div>${payload.company?.address || ""}</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const buildSlipFromSnapshot = (
    snapshot: NonNullable<typeof placedOrder>,
    logoOverride?: string
  ) => {
    if (!snapshot) return "";
    const logoSrc = logoOverride || resolvePublicUrl("/images/zaikest-logo.png");
    const orderDate = new Date().toLocaleString();
    const rows = (snapshot.items || [])
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">PKR ${item.total ?? (item.price * item.quantity)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Zaikest Order Summary</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 24px; color: #111827;">
          <div style="max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${logoSrc ? `<img src="${logoSrc}" alt="Zaikest" style="width: 48px; height: 48px; object-fit: contain;" />` : ""}
                <div>
                  <div style="font-size: 20px; font-weight: 700;">Zaikest</div>
                  <div style="font-size: 12px; color: #6b7280;">Order Summary Slip</div>
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div>${orderDate}</div>
              </div>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
              <div style="font-weight: 600; margin-bottom: 6px;">Customer</div>
              <div>${snapshot.user.name || ""}</div>
              <div>${snapshot.user.phone || ""}</div>
              <div>${snapshot.user.address || ""}</div>
              <div>${snapshot.user.email || ""}</div>
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
                <span>PKR ${snapshot.total ?? 0}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePlaceOrder = async () => {
    setError("");
    setSuccess("");
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
      const orderJson = serverData?.order ?? serverData;
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
      setSuccess("Order placed successfully.");
      clearCart();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device.");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
        setUser((prev) => ({ ...prev, address: locationText }));
      },
      () => {
        setError("Unable to access location. Please allow location access.");
      }
    );
  };

  const containerClass =
    variant === "modal"
      ? "max-w-5xl mx-auto py-6 px-4"
      : "max-w-6xl mx-auto py-12 px-4";
  const cardClass =
    variant === "modal"
      ? "bg-gray-100 border border-gray-200 shadow-lg rounded-2xl p-5"
      : "bg-white/90 border border-green-100 shadow-lg rounded-2xl p-6";
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-200";
  const inputClassPlain = "w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-200";

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className={`relative overflow-hidden ${containerClass} text-center`}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55 animate-hero-pan"
          style={{ backgroundImage: "url(https://source.unsplash.com/KytjZvzXg4c/2000x1400)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-white/35" aria-hidden />
        <div className="relative z-10">
        <h1 className="text-2xl font-extrabold text-white">Your cart is empty</h1>
        <Link href="/products" className="text-green-700 hover:text-green-800 mt-4 inline-block">
          Browse Products
        </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <motion.div
        className={`relative overflow-hidden ${containerClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55 animate-hero-pan"
          style={{ backgroundImage: "url(https://source.unsplash.com/G3oLwnxlQUA/2000x1400)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-white/35" aria-hidden />
        <div className="relative z-10">
        <div
          className={`${
            variant === "modal"
              ? "bg-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-7"
              : "bg-white/90 border border-green-100 shadow-2xl rounded-3xl p-8"
          } text-center`}
        >
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
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${containerClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55 animate-hero-pan"
        style={{ backgroundImage: "url(https://source.unsplash.com/RBI-xCk0c0g/2000x1400)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-white/35" aria-hidden />
      <div className="relative z-10">
      {variant === "modal" && (orderPlaced || error) && (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
            error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {error ? error : "Order placed successfully. Closing shortly..."}
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6 text-center text-green-950">Checkout</h1>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 text-center">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 text-center">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`${cardClass} space-y-4`}>
          <h2 className="font-semibold text-xl border-b border-green-100 pb-2">Delivery Details</h2>

          <label className="text-sm font-medium text-green-900">Full name</label>
          <input
            value={user.name}
            onChange={(e) =>
              setUser({ ...user, name: sanitizeText(e.target.value) })
            }
            className={inputClass}
            disabled={isPlacingOrder}
            required
          />

          <label className="text-sm font-medium text-green-900">Email address</label>
          <input
            value={user.email}
            onChange={(e) =>
              setUser({ ...user, email: sanitizeEmail(e.target.value) })
            }
            className={inputClass}
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
            className={inputClassPlain}
            disabled={isPlacingOrder}
            required
          />

          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-green-900 flex items-center gap-2">
              <MapPin size={16} />
              Delivery address
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs font-semibold text-green-700 hover:text-green-800"
            >
              Use current location
            </button>
          </div>
          <textarea
            placeholder="Enter delivery address"
            value={user.address}
            onChange={(e) => setUser({ ...user, address: sanitizeAddress(e.target.value) })}
            className={`${inputClassPlain} min-h-[110px] resize-none`}
            disabled={isPlacingOrder}
            required
          />
        </div>

        <div className={cardClass}>
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
      </div>
    </motion.div>
  );
}




