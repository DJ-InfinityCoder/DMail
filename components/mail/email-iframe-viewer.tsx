"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface EmailIframeViewerProps {
  content?: string | null;
  className?: string;
}

/**
 * Sandboxed auto-resizing iframe viewer for HTML emails.
 * Uses allow-same-origin so parent can measure exact content height
 * while omitting allow-scripts for strict script isolation.
 * Uses an isolated content wrapper to strictly prevent infinite height feedback loops.
 */
export function EmailIframeViewer({ content, className = "" }: EmailIframeViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(300);

  const rawHtml = content || "";

  // Prepare fallback styles & reset inside the isolated document head
  const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    :root {
      color-scheme: light dark;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: auto !important;
      min-height: 0 !important;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1e293b;
      word-break: break-word;
      overflow-wrap: break-word;
      overflow: hidden !important;
      -webkit-text-size-adjust: 100%;
    }
    #dmail-content-root {
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: block;
    }
    @media (prefers-color-scheme: dark) {
      html, body {
        color: #f1f5f9;
      }
      a {
        color: #fb7185 !important;
      }
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: inline-block;
    }
    table {
      max-width: 100% !important;
      border-collapse: collapse;
    }
    a {
      color: #8B1E2D;
      text-decoration: underline;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    blockquote {
      border-left: 3px solid #8B1E2D;
      margin: 8px 0;
      padding-left: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div id="dmail-content-root">
    ${rawHtml}
  </div>
</body>
</html>`;

  const measureAndSetHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const container = doc.getElementById("dmail-content-root") || doc.body;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const contentHeight = Math.ceil(rect.height || container.scrollHeight);

      if (contentHeight > 0) {
        setHeight((prev) => {
          // If within 2px, avoid updating to eliminate infinite resize loops
          if (Math.abs(prev - contentHeight) <= 2) {
            return prev;
          }
          return contentHeight;
        });
      }
    } catch (e) {
      // In case of unexpected access exceptions
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeObserver: ResizeObserver | null = null;

    const setupObservers = () => {
      measureAndSetHeight();

      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Re-measure whenever any image inside the iframe finishes loading
        const images = doc.querySelectorAll("img");
        images.forEach((img) => {
          if (!img.complete) {
            img.addEventListener(
              "load",
              () => requestAnimationFrame(measureAndSetHeight),
              { once: true }
            );
            img.addEventListener(
              "error",
              () => requestAnimationFrame(measureAndSetHeight),
              { once: true }
            );
          }
        });

        // Observe ONLY the inner content wrapper, NEVER doc.body or doc.documentElement
        const container = doc.getElementById("dmail-content-root");
        if (typeof ResizeObserver !== "undefined" && container) {
          resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const h = Math.ceil(
                entry.contentRect.height || entry.target.getBoundingClientRect().height
              );
              if (h > 0) {
                setHeight((prev) => {
                  if (Math.abs(prev - h) <= 2) return prev;
                  return h;
                });
              }
            }
          });
          resizeObserver.observe(container);
        }
      } catch (e) {}
    };

    iframe.addEventListener("load", setupObservers);

    // Initial check if document is already loaded
    if (iframe.contentDocument?.readyState === "complete") {
      setupObservers();
    }

    const timer1 = setTimeout(measureAndSetHeight, 100);
    const timer2 = setTimeout(measureAndSetHeight, 500);

    window.addEventListener("resize", measureAndSetHeight);

    return () => {
      iframe.removeEventListener("load", setupObservers);
      window.removeEventListener("resize", measureAndSetHeight);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [rawHtml, measureAndSetHeight]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title="Email Message Body"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      scrolling="no"
      style={{
        height: `${height}px`,
        width: "100%",
        border: "none",
        overflow: "hidden",
        display: "block",
      }}
      className={`select-text ${className}`}
    />
  );
}
