"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CreditCard, MapPin } from "lucide-react";
import PromoPosters from "./PromoPosters";
import { sanitizeAddress, sanitizeEmail, sanitizePhone, sanitizeText } from "../utils/sanitize";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config/env";
import { resolvePublicUrl } from "../utils/url";
import { normalizeRemoteUrl, resolveAssetUrl } from "../utils/assetUrl";
import { useTheme } from "../context/ThemeContext";
import EditableText from "./theme/EditableText";
import { useOrderSlip } from "../hooks/useOrderSlip";

export default function CheckoutContent({
  variant = "page",
  onRequestClose,
}: {
  variant?: "page" | "modal";
  onRequestClose?: () => void;
}) {
  const { cart, clearCart } = useCart();
  const { user: authUser } = useAuth();
  const { theme, loading, editMode, canManageTheme, updateTheme } = useTheme();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const previewDeliveryFee = 200;
  const totalPrice = subtotal + previewDeliveryFee;
  const ORDERS_API = `${API_BASE}/v1/orders`;

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    id: "",
  });
  const [addressParts, setAddressParts] = useState({
    houseNo: "",
    street: "",
    city: "",
    area: "",
  });
  const [locationLabel, setLocationLabel] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorTimerRef = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const houseNoInputRef = useRef<HTMLInputElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const citySelectRef = useRef<HTMLSelectElement>(null);
  const areaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser) return;
    setUser((prev) => ({
      ...prev,
      name: authUser.name || prev.name,
      email: authUser.email || prev.email,
      id: authUser.id || prev.id,
    }));
  }, [authUser]);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    };
  }, []);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    items: typeof cart;
    subtotal: number;
    deliveryFee: number;
    total: number;
    user: typeof user;
    serverOrder?: unknown;
    downloadUrl?: string;
  } | null>(null);
  const {
    loading: isSlipDownloading,
    error: slipDownloadError,
    clearError: clearSlipDownloadError,
    downloadPdf: downloadSlipPdf,
  } = useOrderSlip();

  useEffect(() => {
    if (!slipDownloadError) return;
    setError(slipDownloadError);
  }, [slipDownloadError]);

  // No auto-close for modal; user closes via button.
  const buildFullAddress = (parts: typeof addressParts) =>
    sanitizeAddress(
      [
        parts.houseNo ? `House No: ${parts.houseNo}` : "",
        parts.street ? `Street: ${parts.street}` : "",
        parts.area ? `Area: ${parts.area}` : "",
        parts.city || "",
      ]
        .filter(Boolean)
        .join(", ")
    );

  const setAddressAndParts = (nextParts: typeof addressParts) => {
    setAddressParts(nextParts);
    setUser((prev) => ({ ...prev, address: buildFullAddress(nextParts) }));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const showFieldError = (field: string, message: string) => {
    setFieldErrors({ [field]: message });
    setError(message);
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => {
      setError("");
      setFieldErrors({});
    }, 3000);
  };

  const focusField = (field: string) => {
    if (field === "name") nameInputRef.current?.focus();
    if (field === "phone") phoneInputRef.current?.focus();
    if (field === "houseNo") houseNoInputRef.current?.focus();
    if (field === "street") streetInputRef.current?.focus();
    if (field === "city") citySelectRef.current?.focus();
    if (field === "area") areaInputRef.current?.focus();
  };

  const getMissingRequiredField = () => {
    if (!user.name.trim()) return { field: "name", message: "Full name is required." };
    if (!user.phone.trim()) return { field: "phone", message: "Phone/WhatsApp is required." };
    if (!addressParts.houseNo.trim()) return { field: "houseNo", message: "House number is required." };
    if (!addressParts.street.trim()) return { field: "street", message: "Street address is required." };
    if (!addressParts.city.trim()) return { field: "city", message: "City is required." };
    if (!addressParts.area.trim()) return { field: "area", message: "Area is required." };
    if (!user.address.trim()) return { field: "street", message: "Complete delivery address is required." };
    return null;
  };

  const pickFirstString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const toFiniteNumber = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const extractSlipPayload = (payload: any) => {
    const slip =
      payload?.summarySlip ||
      payload?.summary ||
      payload?.receipt ||
      payload?.invoice ||
      {};

    const downloadUrl = pickFirstString(
      payload?.summarySlipUrl,
      payload?.summaryUrl,
      payload?.receiptUrl,
      payload?.invoiceUrl,
      payload?.downloadUrl,
      slip?.summarySlipUrl,
      slip?.summaryUrl,
      slip?.receiptUrl,
      slip?.invoiceUrl,
      slip?.downloadUrl,
      slip?.url,
      slip?.fileUrl
    );

    const summaryHtml = pickFirstString(
      payload?.summarySlipHtml,
      payload?.summaryHtml,
      payload?.receiptHtml,
      payload?.invoiceHtml,
      slip?.summarySlipHtml,
      slip?.summaryHtml,
      slip?.receiptHtml,
      slip?.invoiceHtml,
      slip?.html
    );

    return { downloadUrl, summaryHtml, slip };
  };

  const getOrderIdForSlip = (serverOrder: any) =>
    pickFirstString(
      serverOrder?.order?._id,
      serverOrder?.order?.id,
      serverOrder?.order?.orderId,
      serverOrder?._id,
      serverOrder?.id,
      serverOrder?.orderId,
      serverOrder?.data?.order?._id,
      serverOrder?.data?.order?.id,
      serverOrder?.data?.order?.orderId
    );

  const handleDownloadReceipt = async () => {
    if (!placedOrder) return;
    let serverDownloadUrl = placedOrder.downloadUrl || "";
    const orderId = getOrderIdForSlip(placedOrder.serverOrder as any);
    const guestPhone = pickFirstString(placedOrder.user.phone);
    const pdfFilename = `zaikest-order-summary-${orderId || "slip"}.pdf`;

    if (orderId) {
      try {
        clearSlipDownloadError();
        await downloadSlipPdf(orderId, guestPhone || undefined);
        return;
      } catch {
        // Fall through to backend direct URL if present.
      }
    }

    if (serverDownloadUrl) {
      try {
        const res = await fetch(serverDownloadUrl, { credentials: "include" });
        if (!res.ok) throw new Error("download failed");
        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        const isPdf = contentType.includes("application/pdf");
        if (isPdf) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = blobUrl;
          anchor.download = pdfFilename;
          anchor.click();
          URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch {
        // Ignore and surface backend slip availability message below.
      }
    }

    setError("Backend summary slip PDF is not available yet for this order.");
  };

  const formatPkr = (value: unknown) => `PKR ${toFiniteNumber(value, 0).toLocaleString("en-PK")}`;

  const buildSlipShell = ({
    companyName,
    logoSrc,
    orderDate,
    orderId,
    customerLines,
    rowsHtml,
    subtotal,
    deliveryFee,
    total,
    contactLine,
    addressLine,
  }: {
    companyName: string;
    logoSrc?: string;
    orderDate: string;
    orderId?: string;
    customerLines: string[];
    rowsHtml: string;
    subtotal: unknown;
    deliveryFee: unknown;
    total: unknown;
    contactLine?: string;
    addressLine?: string;
  }) => {
    const safeCustomerLines = customerLines.filter(Boolean);
    const safeOrderId = orderId?.trim();
    const footerMeta = [contactLine, addressLine].filter(Boolean).join(" | ");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${companyName} Order Summary</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; background: radial-gradient(circle at top, #f1f8f3, #eaf1f8 58%); color: #0f172a; padding: 22px;">
          <div style="max-width: 760px; margin: 0 auto;">
            <div style="border-radius: 24px; overflow: hidden; box-shadow: 0 22px 48px rgba(15,23,42,0.16); border: 1px solid #d7e1ee; background: #ffffff;">
              <div style="padding: 24px 26px; background: linear-gradient(125deg, #0e4f35 0%, #19744f 60%, #205f87 100%); color: #ffffff;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    ${logoSrc ? `<div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.96); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1px rgba(15,23,42,0.08);"><img src="${logoSrc}" alt="${companyName}" style="width: 44px; height: 44px; object-fit: contain;" /></div>` : ""}
                    <div>
                      <div style="font-size: 22px; line-height: 1.2; font-weight: 800; letter-spacing: 0.2px;">${companyName}</div>
                      <div style="font-size: 12px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Order Summary Slip</div>
                    </div>
                  </div>
                  <div style="text-align: right; font-size: 12px; line-height: 1.55; opacity: 0.95;">
                    <div>${orderDate}</div>
                    ${safeOrderId ? `<div style="font-weight: 700;">Order ID: ${safeOrderId}</div>` : ""}
                  </div>
                </div>
              </div>

              <div style="padding: 22px 24px 24px;">
                <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px;">
                  <div style="flex: 1 1 280px; min-width: 240px; border: 1px solid #d8e3f0; background: #f8fbff; border-radius: 14px; padding: 14px 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.9px; color: #53657d; font-weight: 700; margin-bottom: 8px;">Customer Details</div>
                    ${safeCustomerLines.map((line) => `<div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;">${line}</div>`).join("")}
                  </div>
                  <div style="flex: 0 1 210px; min-width: 180px; border: 1px solid #d8e3f0; background: #f4f8f6; border-radius: 14px; padding: 14px 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.9px; color: #506070; font-weight: 700; margin-bottom: 8px;">Payment Summary</div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;"><span>Subtotal</span><span style="font-weight: 700;">${formatPkr(subtotal)}</span></div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;"><span>Delivery</span><span style="font-weight: 700;">${formatPkr(deliveryFee)}</span></div>
                  </div>
                </div>

                <div style="border: 1px solid #dbe5f1; border-radius: 14px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #ecf2fa; color: #20324a;">
                        <th style="text-align: left; padding: 11px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.7px;">Item</th>
                        <th style="text-align: center; padding: 11px 10px; width: 90px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.7px;">Qty</th>
                        <th style="text-align: right; padding: 11px 14px; width: 140px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.7px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </div>

                <div style="margin-top: 16px; border: 1px solid #d2deec; border-radius: 14px; background: #f8fbff; padding: 14px 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #304258;">
                    <span>Subtotal</span>
                    <strong>${formatPkr(subtotal)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #304258;">
                    <span>Delivery</span>
                    <strong>${formatPkr(deliveryFee)}</strong>
                  </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #cad8ea; padding-top: 10px; font-size: 17px; font-weight: 800; color: #0e6a45;">
                      <span>Total Payable</span>
                      <span>${formatPkr(total)}</span>
                    </div>
                  </div>

                <div style="margin-top: 14px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.55;">
                  ${footerMeta || "Thank you for ordering with us."}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const buildSlipFromOrderJson = (order: any, logoOverride?: string) => {
    if (!order) return "";
    const payload = order?.order ?? order;
    const companyLogo = resolveAssetUrl(
      normalizeRemoteUrl(
        pickFirstString(
          payload?.company?.logo,
          payload?.receipt?.company?.logo,
          payload?.summarySlip?.company?.logo
        )
      ),
      ""
    );
    const logoSrc = logoOverride || companyLogo || resolvePublicUrl("/images/zaikest-logo1.png");
    const orderDate = payload.orderDate
      ? new Date(payload.orderDate).toLocaleString()
      : new Date().toLocaleString();

    const items = Array.isArray(payload.items) ? payload.items : [];
    const rows = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e5edf7;">${item.name || "Item"}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5edf7; text-align: center;">${toFiniteNumber(item.quantity, 0)}</td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e5edf7; text-align: right; font-weight: 700;">${formatPkr(item.total ?? (item.price * item.quantity))}</td>
          </tr>
        `
      )
      .join("");

    const computedTotal =
      payload.totalAmount ??
      payload.total ??
      (payload.subtotal != null
        ? Number(payload.subtotal) + Number(payload.deliveryFee ?? 0)
        : undefined) ??
      items.reduce(
        (sum: number, item: any) => sum + (item.total ?? (item.price * item.quantity)),
        0
      );
    const computedSubtotal =
      payload.subtotal ??
      items.reduce(
        (sum: number, item: any) => sum + (item.total ?? (item.price * item.quantity)),
        0
      );
    const computedDeliveryFee =
      payload.deliveryFee ??
      Math.max(0, Number(computedTotal) - Number(computedSubtotal));

    return buildSlipShell({
      companyName: payload.company?.name || "Zaikest",
      logoSrc,
      orderDate,
      orderId: payload.orderId || payload.id || payload._id,
      customerLines: [
        payload.customer?.name || "",
        payload.customer?.phone || "",
        payload.customer?.address || "",
        payload.customer?.city || "",
      ],
      rowsHtml: rows,
      subtotal: computedSubtotal ?? 0,
      deliveryFee: computedDeliveryFee ?? 0,
      total: computedTotal ?? 0,
      contactLine: [payload.company?.email, payload.company?.phone].filter(Boolean).join(" | "),
      addressLine: payload.company?.address || "",
    });
  };

  const buildSlipFromSnapshot = (
    snapshot: NonNullable<typeof placedOrder>,
    logoOverride?: string
  ) => {
    if (!snapshot) return "";
    const orderPayload = (snapshot.serverOrder as any)?.order ?? snapshot.serverOrder ?? {};
    const companyLogo = resolveAssetUrl(
      normalizeRemoteUrl(
        pickFirstString(
          orderPayload?.company?.logo,
          orderPayload?.receipt?.company?.logo,
          orderPayload?.summarySlip?.company?.logo
        )
      ),
      ""
    );
    const logoSrc = logoOverride || companyLogo || resolvePublicUrl("/images/zaikest-logo1.png");
    const orderDate = new Date().toLocaleString();
    const rows = (snapshot.items || [])
      .map(
        (item: any) => `
          <tr>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e5edf7;">${item.name || "Item"}</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #e5edf7; text-align: center;">${toFiniteNumber(item.quantity, 0)}</td>
            <td style="padding: 12px 14px; border-bottom: 1px solid #e5edf7; text-align: right; font-weight: 700;">${formatPkr(item.total ?? (item.price * item.quantity))}</td>
          </tr>
        `
      )
      .join("");
    const snapshotSubtotal = snapshot.subtotal ?? 0;
    const snapshotDeliveryFee = snapshot.deliveryFee ?? 0;

    return buildSlipShell({
      companyName: "Zaikest",
      logoSrc,
      orderDate,
      customerLines: [
        snapshot.user.name || "",
        snapshot.user.phone || "",
        snapshot.user.address || "",
        snapshot.user.email || "",
      ],
      rowsHtml: rows,
      subtotal: snapshotSubtotal,
      deliveryFee: snapshotDeliveryFee,
      total: snapshot.total ?? 0,
      contactLine: snapshot.user.email || "",
      addressLine: snapshot.user.address || "",
    });
  };

  const handlePlaceOrder = async () => {
    setError("");
    setSuccess("");
    const missingField = getMissingRequiredField();
    if (missingField) {
      showFieldError(missingField.field, missingField.message);
      focusField(missingField.field);
      return;
    }
    if (addressParts.city.trim().toLowerCase() !== "karachi") {
      setError(theme.content.checkoutKarachiOnlyError || "Delivery address must be within Karachi");
      return;
    }

    if (cart.length === 0) {
      setError(theme.content.checkoutCartEmptyError || "Your cart is empty");
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
      const orderJson = serverData?.order ?? serverData?.data?.order ?? serverData;
      const { downloadUrl, slip } = extractSlipPayload(serverData);

      const serverSubtotal = Number(
        orderJson?.subtotal ??
          serverData?.subtotal ??
          serverData?.pricing?.subtotal ??
          slip?.subtotal ??
          subtotal
      );
      const serverDeliveryFee = Number(
        orderJson?.deliveryFee ??
          serverData?.deliveryFee ??
          serverData?.pricing?.deliveryFee ??
          slip?.deliveryFee ??
          0
      );
      const serverTotal = toFiniteNumber(
        orderJson?.totalAmount ??
          orderJson?.total ??
          serverData?.totalAmount ??
          serverData?.total ??
          serverData?.pricing?.totalAmount ??
          serverData?.pricing?.total ??
          slip?.totalAmount ??
          slip?.total,
        serverSubtotal + serverDeliveryFee
      );

      const orderSnapshot = {
        items: cart,
        subtotal: serverSubtotal,
        deliveryFee: serverDeliveryFee,
        total: serverTotal,
        user,
        serverOrder: serverData,
        downloadUrl,
      };

      setOrderPlaced(true);
      setPlacedOrder(orderSnapshot);
      setSuccess(theme.content.checkoutOrderPlacedSuccess || "Order placed successfully.");
      clearCart();
    } catch {
      setError(theme.content.checkoutNetworkError || "Network error. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(theme.content.checkoutLocationUnsupportedError || "Location is not supported on this device.");
      return;
    }
    setError("");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const exactPoint = `Point: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const cacheKey = `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
        const cleanText = (value?: unknown) =>
          String(value ?? "")
            .replace(/\s+/g, " ")
            .trim();
        const buildAddressText = (payload: any) => {
          const address = payload?.address || {};
          const place = cleanText(
            address.amenity ||
              address.building ||
              address.shop ||
              address.office ||
              address.house_name ||
              address.attraction ||
              address.university ||
              address.college ||
              address.school ||
              address.hostel ||
              payload?.name ||
              payload?.namedetails?.["name:en"] ||
              payload?.namedetails?.name ||
              payload?.namedetails?.official_name
          );
          const street = [cleanText(address.house_number), cleanText(address.road || address.pedestrian || address.footway)]
            .filter(Boolean)
            .join(" ");
          const area = cleanText(
            address.neighbourhood ||
              address.suburb ||
              address.quarter ||
              address.residential ||
              address.hamlet ||
              address.city_district ||
              address.city
          );
          const district = cleanText(
            address.county ||
              address.state_district ||
              address.city_district ||
              address.city ||
              address.town ||
              address.village
          );
          const parts = [
            place ? `Place: ${place}` : "",
            street ? `Street: ${street}` : "",
            area ? `Area: ${area}` : "",
            district && district !== area ? `District: ${district}` : "",
            exactPoint,
          ].filter((part, index, arr) => Boolean(part) && arr.indexOf(part) === index);
          return parts.join(", ");
        };
        const fetchReverse = async () => {
          const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
            `&lat=${encodeURIComponent(String(latitude))}` +
            `&lon=${encodeURIComponent(String(longitude))}` +
            `&addressdetails=1&zoom=18&namedetails=1&extratags=1&accept-language=en`;

          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 12000);
          try {
            const res = await fetch(url, {
              method: "GET",
              headers: { Accept: "application/json" },
              cache: "no-store",
              signal: controller.signal,
            });
            if (!res.ok) throw new Error("reverse geocode failed");
            return await res.json();
          } finally {
            window.clearTimeout(timeoutId);
          }
        };

        try {
          let data: any = null;
          try {
            data = await fetchReverse();
          } catch {
            // Single retry for transient network/provider issues.
            await new Promise((resolve) => window.setTimeout(resolve, 600));
            data = await fetchReverse();
          }

          const address = data?.address || {};
          const placeName = cleanText(
            address.amenity ||
              address.building ||
              address.shop ||
              data?.name ||
              "Current Location"
          );
          const nextParts = {
            houseNo: cleanText(address.house_number || ""),
            street: cleanText(address.road || address.pedestrian || address.footway || data?.display_name || exactPoint),
            area: cleanText(address.neighbourhood || address.suburb || address.quarter || address.residential || ""),
            // City must be selected manually from the dropdown for Karachi validation.
            city: cleanText(addressParts.city),
          };
          setLocationLabel(placeName);
          setAddressAndParts(nextParts);
          const fullAddress = buildAddressText(data);
          try {
            localStorage.setItem(cacheKey, fullAddress);
          } catch {
            // Ignore cache failures.
          }
          if (Number.isFinite(accuracy) && accuracy > 80) {
            setError(
              `GPS accuracy is low (${Math.round(accuracy)}m). Move outdoors and try again for better area/street accuracy.`
            );
          }
        } catch {
          const cachedAddress = (() => {
            try {
              return localStorage.getItem(cacheKey) || "";
            } catch {
              return "";
            }
          })();
          if (cachedAddress) {
            setLocationLabel("Saved location");
            setAddressAndParts({
              houseNo: "",
              street: sanitizeAddress(cachedAddress),
              area: "",
              city: "Karachi",
            });
            setError(theme.content.checkoutLocationCachedNotice || "Using last known saved location for this area.");
          } else {
            setLocationLabel("Current Location");
            setAddressAndParts({
              houseNo: "",
              street: exactPoint,
              area: "",
              city: "Karachi",
            });
            setError(theme.content.checkoutLocationFallbackError || "Exact address not found. Coordinates were added instead.");
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setError(
          theme.content.checkoutLocationAccessError ||
            "Unable to access location. Please allow location access."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const containerClass =
    variant === "modal"
      ? "w-full py-5 sm:py-6 px-3 sm:px-4"
      : "w-full py-8 sm:py-12 px-3 sm:px-4";
  const contentWidthClass = variant === "modal" ? "max-w-5xl mx-auto" : "max-w-6xl mx-auto";
  const cardClass =
    variant === "modal"
      ? "bg-gray-100 border border-gray-200 shadow-lg rounded-2xl p-4 sm:p-5"
      : "bg-[#e8ebef]/95 border border-[#c5ced6] shadow-[0_8px_24px_rgba(15,23,42,0.14)] rounded-3xl p-4 sm:p-6";
  const inputClass =
    "w-full border border-[#9fa9b4] rounded-xl px-4 py-3 bg-[#d8dee5] text-[#1d2329] placeholder:text-[#6f7884]";
  const inputClassPlain =
    "w-full border border-[#9fa9b4] rounded-xl px-4 py-3 bg-[#d8dee5] text-[#1d2329] placeholder:text-[#6f7884]";
  const inputGroupClass = "space-y-2";
  const withFieldValidationClass = (baseClass: string, field: string) =>
    fieldErrors[field] ? `${baseClass} border-red-500 ring-2 ring-red-200 bg-red-50` : baseClass;
  const isFormComplete =
    !!user.name.trim() &&
    !!user.phone.trim() &&
    !!addressParts.houseNo.trim() &&
    !!addressParts.street.trim() &&
    !!addressParts.city.trim() &&
    !!addressParts.area.trim() &&
    !!user.address.trim();
  const checkoutBgStyle = {
    backgroundImage:
      "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80), url('/images/wide-banner.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  } as const;
  const placedOrderPayload = (placedOrder?.serverOrder as any)?.order ?? (placedOrder?.serverOrder as any) ?? {};
  const placedCompanyName =
    pickFirstString(
      placedOrderPayload?.company?.name,
      placedOrderPayload?.receipt?.company?.name
    ) || "Zaikest";
  const placedCompanyLogo = resolveAssetUrl(
    normalizeRemoteUrl(
      pickFirstString(
        placedOrderPayload?.company?.logo,
        placedOrderPayload?.receipt?.company?.logo
      )
    ),
    resolvePublicUrl("/images/zaikest-logo1.png")
  );

  if (loading) {
    return (
      <div className={`relative overflow-hidden ${containerClass}`}>
        <div className="absolute inset-0 bg-black/65" aria-hidden />
        <div className={`relative z-10 ${contentWidthClass} text-center py-16 text-white/90`}>
          Loading checkout...
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className={`relative overflow-hidden ${containerClass} text-center`}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55 animate-mart-pan"
          style={checkoutBgStyle}
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden />
        <div className={`relative z-10 ${contentWidthClass}`}>
        <EditableText
          as="h1"
          className="text-2xl font-extrabold text-white"
          value={theme.content.checkoutEmptyTitle}
          fallback="Your cart is empty"
          editMode={editMode && canManageTheme}
          onSave={(next) => updateTheme({ content: { checkoutEmptyTitle: next } })}
        />
        <Link href="/products" className="text-green-700 hover:text-green-800 mt-4 inline-block">
          {editMode && canManageTheme ? (
            <EditableText
              value={theme.content.checkoutEmptyCta}
              fallback="Browse Products"
              editMode={true}
              onSave={(next) => updateTheme({ content: { checkoutEmptyCta: next } })}
            />
          ) : (
            theme.content.checkoutEmptyCta || "Browse Products"
          )}
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
          className="absolute inset-0 bg-cover bg-center opacity-55 animate-mart-pan"
          style={checkoutBgStyle}
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden />
        <div className={`relative z-10 ${contentWidthClass}`}>
        <div
          className={`${
            variant === "modal"
              ? "bg-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-4 sm:p-6"
              : "bg-white/95 border border-[#d5e4dd] shadow-[0_22px_56px_rgba(15,23,42,0.25)] rounded-3xl p-4 sm:p-7"
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-[#d4e2db] bg-[#f7fbf8]">
            <div className="bg-gradient-to-r from-[#0f5132] via-[#17724b] to-[#1f5f86] px-4 sm:px-6 py-4 sm:py-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white/95 p-2">
                    <Image
                      src={placedCompanyLogo}
                      alt={placedCompanyName}
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                      {theme.content.checkoutConfirmedTitle || "Order Confirmed"}
                    </p>
                    <p className="text-lg sm:text-xl font-extrabold">{placedCompanyName}</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-white/90">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <EditableText
                as="p"
                className="mt-3 text-sm sm:text-base text-white/95"
                value={theme.content.checkoutConfirmedSubtitle}
                fallback="Thank you for shopping with Zaikest"
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { checkoutConfirmedSubtitle: next } })}
                multiline
              />
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                <div className="rounded-xl border border-[#d7e4ee] bg-[#f3f8fd] p-3 sm:p-4 text-left text-sm text-[#213146] space-y-1.5">
                  <p><strong>{theme.content.checkoutNameLabel || "Full name"}:</strong> {placedOrder?.user.name || "-"}</p>
                  <p><strong>{theme.content.checkoutEmailLabel || "Email address"}:</strong> {placedOrder?.user.email || "-"}</p>
                  <p><strong>{theme.content.checkoutPhoneLabel || "Phone/WhatsApp"}:</strong> {placedOrder?.user.phone || "-"}</p>
                  <p><strong>{theme.content.checkoutAddressLabel || "Complete delivery address"}:</strong> {placedOrder?.user.address || "-"}</p>
                </div>

                <div className="rounded-xl border border-[#d9e4dc] bg-[#f1f8f3] p-3 sm:p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.14em] font-semibold text-[#4a5f56] mb-2">Order Amount</p>
                  <div className="space-y-2 text-sm text-[#26403a]">
                    <div className="flex items-center justify-between">
                      <span>{theme.content.checkoutSubtotalLabel || "Subtotal"}</span>
                      <span className="font-semibold">{formatPkr(placedOrder?.subtotal ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{theme.content.checkoutDeliveryLabel || "Delivery"}</span>
                      <span className="font-semibold">{formatPkr(placedOrder?.deliveryFee ?? 200)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#cadecf] pt-2 text-base font-extrabold text-[#0f5f3f]">
                      <span>{theme.content.checkoutTotalLabel || "Total"}</span>
                      <span>{formatPkr(placedOrder?.total ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#d7e4ee] bg-white overflow-hidden mb-5">
                <div className="grid grid-cols-[1fr_auto] gap-3 px-3 sm:px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] bg-[#eaf2fa] text-[#334a62]">
                  <span>Items ({placedOrder?.items.length || 0})</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-[#e6eef7]">
                  {placedOrder?.items.map((item) => (
                    <div key={item._id} className="grid grid-cols-[1fr_auto] gap-3 px-3 sm:px-4 py-3 text-sm text-[#1f324a]">
                      <span className="min-w-0 break-words">{item.name} x {item.quantity}</span>
                      <span className="shrink-0 font-semibold">{formatPkr(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-green-700 text-white px-6 py-3 rounded-full hover:bg-green-800 transition w-full sm:w-auto"
            >
              {editMode && canManageTheme ? (
                <EditableText
                  value={theme.content.checkoutContinueShoppingText}
                  fallback="Continue Shopping"
                  editMode={true}
                  onSave={(next) => updateTheme({ content: { checkoutContinueShoppingText: next } })}
                />
              ) : (
                theme.content.checkoutContinueShoppingText || "Continue Shopping"
              )}
            </Link>

            <button
              onClick={handleDownloadReceipt}
              className="inline-flex items-center justify-center bg-white border border-green-200 text-green-900 px-6 py-3 rounded-full font-semibold hover:border-green-400 transition w-full sm:w-auto"
              disabled={isSlipDownloading}
            >
              {isSlipDownloading
                ? "Preparing PDF..."
                : editMode && canManageTheme ? (
                    <EditableText
                      value={theme.content.checkoutDownloadSlipText}
                      fallback="Download Summary Slip"
                      editMode={true}
                      onSave={(next) => updateTheme({ content: { checkoutDownloadSlipText: next } })}
                    />
                  ) : (
                    theme.content.checkoutDownloadSlipText || "Download Summary Slip"
                  )}
            </button>
          </div>
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
        className="absolute inset-0 bg-cover bg-center opacity-55 animate-mart-pan"
        style={checkoutBgStyle}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/65" aria-hidden />
      <div className={`relative z-10 ${contentWidthClass}`}>
      {variant === "modal" && (orderPlaced || error) && (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
            error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {error
            ? error
            : `${theme.content.checkoutOrderPlacedSuccess || "Order placed successfully."} Closing shortly...`}
        </div>
      )}
      <EditableText
        as="h1"
        className="text-2xl sm:text-3xl font-extrabold mb-5 sm:mb-6 text-center text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
        value={theme.content.checkoutTitle}
        fallback="Checkout"
        editMode={editMode && canManageTheme}
        onSave={(next) => updateTheme({ content: { checkoutTitle: next } })}
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div className={`${cardClass} space-y-4 sm:space-y-5`}>
          <EditableText
            as="h2"
            className="font-semibold text-lg sm:text-xl border-b border-green-100 pb-2"
            value={theme.content.checkoutDeliveryTitle}
            fallback="Delivery Details"
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { checkoutDeliveryTitle: next } })}
          />

          <div className={inputGroupClass}>
            <label className="text-sm font-medium text-green-900 block">
              {(theme.content.checkoutNameLabel || "Full name") + " (required)"}
            </label>
            <input
              ref={nameInputRef}
              value={user.name}
              onChange={(e) =>
                (setUser({ ...user, name: sanitizeText(e.target.value) }), clearFieldError("name"))
              }
              className={withFieldValidationClass(inputClass, "name")}
              disabled={isPlacingOrder}
              required
            />
          </div>

          <div className={inputGroupClass}>
            <label className="text-sm font-medium text-green-900 block">
              {(theme.content.checkoutEmailLabel || "Email address") + " (optional)"}
            </label>
            <input
              value={user.email}
              onChange={(e) =>
                setUser({ ...user, email: sanitizeEmail(e.target.value) })
              }
              className={inputClass}
              disabled={isPlacingOrder}
            />
          </div>

          <div className={inputGroupClass}>
            <label className="text-sm font-medium text-green-900 flex items-center gap-2">
              {(theme.content.checkoutPhoneLabel || "Phone/WhatsApp") + " (required)"}
            </label>
            <input
              ref={phoneInputRef}
              placeholder={theme.content.checkoutPhonePlaceholder || "Enter phone number"}
              value={user.phone}
              onChange={(e) => {
                setUser({ ...user, phone: sanitizePhone(e.target.value) });
                clearFieldError("phone");
              }}
              className={withFieldValidationClass(inputClassPlain, "phone")}
              disabled={isPlacingOrder}
              required
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
            <label className="text-sm font-medium text-green-900 flex items-center gap-2">
              <MapPin size={16} />
              {(theme.content.checkoutAddressLabel || "Complete delivery address") + " (required)"}
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-xs font-semibold text-green-700 hover:text-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLocating || isPlacingOrder}
            >
              {isLocating
                ? theme.content.checkoutGettingLocationText || "Getting location..."
                : theme.content.checkoutUseCurrentLocationText || "Use current location"}
            </button>
          </div>

          <div className="rounded-xl border border-[#b8c3cf] bg-[#d9e0e8] p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-green-900 font-medium">
              <MapPin size={18} />
              <span>{locationLabel || "Current Location"}</span>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center justify-center rounded-lg bg-[#c7d0db] px-4 py-2 text-sm font-semibold text-[#243243] hover:bg-[#b9c4d1] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLocating || isPlacingOrder}
            >
              {isLocating
                ? theme.content.checkoutGettingLocationText || "Getting location..."
                : theme.content.checkoutUseCurrentLocationText || "Use current location"}
            </button>
          </div>

          <div className="rounded-xl border border-[#b8c3cf] bg-[#edf1f5] p-4 sm:p-5 space-y-3">
            <h3 className="text-xl font-semibold text-[#1d2329]">Address</h3>

            <div className={inputGroupClass}>
              <label className="text-sm font-medium text-green-900 block">House No:</label>
              <input
                ref={houseNoInputRef}
                placeholder="e.g. House #5"
                value={addressParts.houseNo}
                onChange={(e) => {
                  setAddressAndParts({
                    ...addressParts,
                    houseNo: sanitizeText(e.target.value),
                  });
                  clearFieldError("houseNo");
                }}
                className={withFieldValidationClass(inputClass, "houseNo")}
                disabled={isPlacingOrder}
                required
              />
            </div>

            <div className={inputGroupClass}>
              <label className="text-sm font-medium text-green-900 block">Street Address</label>
              <input
                ref={streetInputRef}
                placeholder="e.g. Street 2, Block A"
                value={addressParts.street}
                onChange={(e) => {
                  setAddressAndParts({
                    ...addressParts,
                    street: sanitizeAddress(e.target.value),
                  });
                  clearFieldError("street");
                }}
                className={withFieldValidationClass(inputClass, "street")}
                disabled={isPlacingOrder}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                ref={citySelectRef}
                value={addressParts.city}
                onChange={(e) => {
                  setAddressAndParts({
                    ...addressParts,
                    city: sanitizeText(e.target.value),
                  });
                  clearFieldError("city");
                }}
                className={withFieldValidationClass(inputClass, "city")}
                disabled={isPlacingOrder}
                required
              >
                <option value="" disabled>
                  Select city
                </option>
                <option value="Karachi">Karachi</option>
              </select>
              <input
                ref={areaInputRef}
                placeholder="Area"
                value={addressParts.area}
                onChange={(e) => {
                  setAddressAndParts({
                    ...addressParts,
                    area: sanitizeText(e.target.value),
                  });
                  clearFieldError("area");
                }}
                className={withFieldValidationClass(inputClass, "area")}
                disabled={isPlacingOrder}
                required
              />
            </div>
          </div>
        </div>

        <div className={`${cardClass} space-y-4 sm:space-y-5`}>
          <EditableText
            as="h2"
            className="font-semibold text-lg sm:text-xl border-b border-green-100 pb-2 mb-3 sm:mb-4"
            value={theme.content.checkoutOrderSummaryTitle}
            fallback="Order Summary"
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { checkoutOrderSummaryTitle: next } })}
          />

          <div className="rounded-xl border border-gray-400 bg-gray-200 p-3 sm:p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-800">
              Items ({cart.length})
            </div>
            <div className="space-y-2.5">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-gray-400 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="min-w-0 break-words text-gray-900">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-gray-900">
                    PKR {item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-500 bg-gray-300 p-3 sm:p-4 space-y-2.5">
            <div className="flex justify-between text-sm text-gray-800">
              <span>{theme.content.checkoutSubtotalLabel || "Subtotal"}</span>
              <span>PKR {subtotal}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-800">
              <span>{theme.content.checkoutDeliveryLabel || "Delivery"}</span>
              <span>PKR {previewDeliveryFee}</span>
            </div>

            <div className="flex justify-between font-extrabold text-base sm:text-lg border-t border-gray-500 pt-2.5 mt-1 text-gray-900">
              <span>{theme.content.checkoutTotalLabel || "Total"}</span>
              <span>PKR {totalPrice}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className={`w-full text-white py-3 rounded-xl font-semibold transition inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              isFormComplete ? "bg-green-700 hover:bg-green-800" : "bg-gray-500 hover:bg-gray-600"
            }`}
            disabled={isPlacingOrder}
            aria-disabled={!isFormComplete}
          >
            <CreditCard size={18} />
            {isPlacingOrder ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                {theme.content.checkoutPlacingText || "Placing..."}
              </>
            ) : (
              editMode && canManageTheme ? (
                <EditableText
                  value={theme.content.checkoutPlaceOrderText}
                  fallback="Place Order"
                  editMode={true}
                  onSave={(next) => updateTheme({ content: { checkoutPlaceOrderText: next } })}
                />
              ) : (
                theme.content.checkoutPlaceOrderText || "Place Order"
              )
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








