"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  mobileShowRight?: boolean;
}

export function ResizableSplitPane({
  left,
  right,
  defaultWidth = 380,
  minWidth = 280,
  maxWidth = 650,
  storageKey = "dmail_split_pane_width",
  mobileShowRight = false,
}: ResizableSplitPaneProps) {
  const [width, setWidth] = useState<number>(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          setWidth(parsed);
        }
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, newWidth.toString());
        }
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.touches[0].clientX - containerRect.left;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, newWidth.toString());
        }
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, storageKey]);

  return (
    <div
      ref={containerRef}
      className={`w-full flex h-full overflow-hidden min-w-0 ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Desktop Left Pane (Resizable) */}
      <div
        style={{ width: `${width}px` }}
        className="hidden md:block flex-shrink-0 h-full overflow-hidden"
      >
        {left}
      </div>

      {/* Mobile view rendering (single pane toggle) */}
      <div className="md:hidden w-full h-full overflow-hidden">
        {mobileShowRight ? right : left}
      </div>

      {/* Draggable Divider Handle Bar (Desktop only) */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`
          hidden md:flex w-1.5 h-full cursor-col-resize flex-shrink-0 items-center justify-center
          transition-colors duration-150 relative z-30 group select-none
          ${isDragging ? "bg-[#8B1E2D]" : "bg-border/40 hover:bg-[#8B1E2D]/60"}
        `}
        title="Drag to adjust column width"
      >
        {/* Grip Pill */}
        <div
          className={`w-1 h-8 rounded-full transition-colors ${
            isDragging ? "bg-white" : "bg-muted-foreground/30 group-hover:bg-white"
          }`}
        />
      </div>

      {/* Desktop Right Pane (Flexible remaining area) */}
      <div className="hidden md:block flex-1 h-full min-w-0 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
