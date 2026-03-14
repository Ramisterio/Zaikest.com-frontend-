"use client";

import { apiPath } from "../config/env";

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/ogg"]);

export type ThemeMediaType = "image" | "video";

export const inferThemeMediaType = (url: string, mime = ""): ThemeMediaType => {
  const lowered = url.toLowerCase();
  if (mime.startsWith("video/") || lowered.match(/\.(mp4|webm|ogg|ogv|mov)(\?|#|$)/)) {
    return "video";
  }
  return "image";
};

export const validateThemeMediaFile = (file: File, allowVideo: boolean) => {
  if (file.size > MAX_MEDIA_BYTES) {
    return `File is too large. Max size is ${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MB.`;
  }
  if (allowVideo) {
    if (!ALLOWED_IMAGE_MIME.has(file.type) && !ALLOWED_VIDEO_MIME.has(file.type)) {
      return "Unsupported file type. Upload an image or video.";
    }
    return "";
  }
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return "Unsupported file type. Upload an image.";
  }
  return "";
};

export const uploadThemeMedia = (
  file: File,
  onProgress?: (percent: number) => void
) =>
  new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiPath("/v1/admin/theme/media"));
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onload = () => {
      const statusOk = xhr.status >= 200 && xhr.status < 300;
      let json: any = {};
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        json = {};
      }
      if (!statusOk) {
        reject(new Error(json?.message || "Failed to upload media"));
        return;
      }
      const url =
        json?.url ||
        json?.path ||
        json?.fileUrl ||
        json?.data?.url ||
        json?.data?.path ||
        json?.data?.fileUrl ||
        "";
      if (!url) {
        reject(new Error("Upload succeeded but no media url returned"));
        return;
      }
      resolve(url as string);
    };

    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
