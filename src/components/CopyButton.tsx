"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The value stays on screen to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="flex h-11 items-center gap-1.5 rounded-lg border border-taupe bg-white px-3 text-sm"
    >
      {copied ? (
        <Check size={16} className="text-mocha" aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
