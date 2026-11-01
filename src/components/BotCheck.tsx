"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { business } from "@/data/business";

type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      size: "flexible";
      theme: "light";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function BotCheck({
  onToken,
  onError,
}: {
  onToken: (token: string) => void;
  onError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  function render() {
    if (!container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: business.turnstileSiteKey,
      size: "flexible",
      theme: "light",
      callback: (token) => {
        setFailed(false);
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        setFailed(true);
        onError();
      },
    });
  }

  useEffect(() => {
    render();
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
    // The widget is created once, and remounting with a new key makes a fresh one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={container} />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-error">
          We couldn&apos;t check your connection. Refresh the page, or send your order on WhatsApp.
        </p>
      )}
    </div>
  );
}
