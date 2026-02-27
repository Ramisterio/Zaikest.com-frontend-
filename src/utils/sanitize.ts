"use client";

export const sanitizeText = (value: string) =>
  value.replace(/[<>]/g, "").replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ");

export const sanitizeEmail = (value: string) =>
  value.replace(/[<>\s]/g, "").trim();

export const sanitizePhone = (value: string) =>
  value.replace(/[^\d+]/g, "").slice(0, 20);

export const sanitizeSearch = (value: string) =>
  value.replace(/[<>]/g, "").replace(/\s+/g, " ").trimStart();

export const sanitizeAddress = (value: string) =>
  value.replace(/[<>]/g, "").replace(/\s{2,}/g, " ");

export const sanitizePassword = (value: string) =>
  value.replace(/[\u0000-\u001F\u007F]/g, "");

export const sanitizeNumber = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};
