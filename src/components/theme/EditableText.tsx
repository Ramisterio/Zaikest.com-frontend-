"use client";

import { ElementType, useEffect, useRef } from "react";
import { sanitizeText } from "../../utils/sanitize";

type EditableTextProps = {
  value: string;
  fallback?: string;
  onSave: (next: string) => void;
  editMode: boolean;
  className?: string;
  as?: ElementType;
  multiline?: boolean;
  placeholder?: string;
};

export default function EditableText({
  value,
  fallback = "",
  onSave,
  editMode,
  className = "",
  as,
  multiline = false,
  placeholder = "",
}: EditableTextProps) {
  const Component = (as || "span") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const displayValue = value || fallback;

  useEffect(() => {
    if (ref.current && editMode) {
      ref.current.textContent = displayValue;
    }
  }, [displayValue, editMode]);

  if (!editMode) {
    return <Component className={className}>{displayValue}</Component>;
  }

  return (
    <Component
      ref={ref as any}
      className={`${className} outline-none ring-1 ring-dashed ring-amber-300/80 rounded`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => {
        const raw = e.currentTarget.textContent || "";
        const next = sanitizeText(raw);
        if (next !== value) onSave(next);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {displayValue}
    </Component>
  );
}
