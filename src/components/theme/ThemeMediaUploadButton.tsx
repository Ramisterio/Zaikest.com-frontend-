"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  inferThemeMediaType,
  uploadThemeMedia,
  validateThemeMediaFile,
  ThemeMediaType,
} from "../../utils/themeMedia";

type ThemeContentKey = keyof ReturnType<typeof useTheme>["theme"]["content"];

type Props = {
  label: string;
  fieldKey: ThemeContentKey;
  typeKey?: ThemeContentKey;
  allowVideo?: boolean;
  className?: string;
};

export default function ThemeMediaUploadButton({
  label,
  fieldKey,
  typeKey,
  allowVideo = false,
  className = "",
}: Props) {
  const { updateTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewType, setPreviewType] = useState<ThemeMediaType>("image");
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(
    null
  );
  const messageColor =
    message?.type === "success" ? "text-green-700" : message?.type === "error" ? "text-red-600" : "";

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setPreviewType(inferThemeMediaType(localPreview, file.type));
    const validationError = validateThemeMediaFile(file, allowVideo);
    if (validationError) {
      setMessage({ text: validationError, type: "error" });
      setProgress(null);
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      setProgress(0);
      const url = await uploadThemeMedia(file, (pct) => setProgress(pct));
      const mediaType: ThemeMediaType = allowVideo
        ? inferThemeMediaType(url, file.type)
        : "image";
      updateTheme({
        content: {
          [fieldKey]: url,
          ...(typeKey ? { [typeKey]: mediaType } : {}),
        },
      } as any);
      setMessage({ text: "Upload complete", type: "success" });
    } catch (e: any) {
      setMessage({ text: e?.message || "Failed to upload media", type: "error" });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <label className="inline-flex items-center gap-2">
        <span className="px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold cursor-pointer hover:bg-black">
          {uploading ? "Uploading..." : label}
        </span>
        <input
          type="file"
          accept={allowVideo ? "image/*,video/*" : "image/*"}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
          disabled={uploading}
        />
      </label>
      {message && (
        <span className={`text-xs font-semibold ${messageColor}`}>{message.text}</span>
      )}
      {typeof progress === "number" && (
        <div className="w-36 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {previewUrl && (
        <div className="mt-2 w-40 h-24 rounded-md overflow-hidden border bg-black/5">
          {previewType === "video" ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
