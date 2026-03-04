"use client";

import { useCallback, useState } from "react";
import { downloadOrderSlipPdf, fetchOrderSlipJson } from "../utils/orderSlip";

export const useOrderSlip = (admin = false) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchJson = useCallback(
    async (orderId: string, phone?: string) => {
      setLoading(true);
      setError(null);
      try {
        return await fetchOrderSlipJson(orderId, phone, admin);
      } catch (err: any) {
        const message = err?.message || "Slip fetch failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [admin]
  );

  const downloadPdf = useCallback(
    async (orderId: string, phone?: string) => {
      setLoading(true);
      setError(null);
      try {
        await downloadOrderSlipPdf(orderId, phone, admin);
      } catch (err: any) {
        const message = err?.message || "PDF download failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [admin]
  );

  return { loading, error, clearError, fetchJson, downloadPdf };
};
