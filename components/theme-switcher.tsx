"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ICON_SIZE = 16;

/**
 * ThemeSwitcher renders a dropdown menu to choose Light, Dark, or System mode.
 */
export const ThemeSwitcher = ({
  align = "start",
  size = "sm",
  variant = "ghost",
  className = "",
}: {
  align?: "start" | "center" | "end";
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default" | "secondary";
  className?: string;
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonStyle = `text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${
    size === "icon" ? "w-9 h-9 p-0 flex items-center justify-center" : "gap-2"
  } ${className}`;

  if (!mounted) {
    return (
      <Button variant={variant} size={size} disabled className={buttonStyle} aria-label="Toggle theme">
        <Sun size={ICON_SIZE} className="text-muted-foreground opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={buttonStyle} aria-label="Select theme">
          {theme === "light" ? (
            <Sun key="light" size={ICON_SIZE} className="text-amber-500" />
          ) : theme === "dark" ? (
            <Moon key="dark" size={ICON_SIZE} className="text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Laptop key="system" size={ICON_SIZE} className="text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36" align={align}>
        <DropdownMenuRadioGroup value={theme} onValueChange={(val) => setTheme(val)}>
          <DropdownMenuRadioItem className="flex items-center gap-2 cursor-pointer" value="light">
            <Sun size={ICON_SIZE} className="text-amber-500" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex items-center gap-2 cursor-pointer" value="dark">
            <Moon size={ICON_SIZE} className="text-slate-400" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex items-center gap-2 cursor-pointer" value="system">
            <Laptop size={ICON_SIZE} className="text-muted-foreground" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * ThemeToggle renders a quick 1-click icon toggle button between Light and Dark modes.
 */
export const ThemeToggle = ({
  size = "sm",
  variant = "ghost",
  className = "",
}: {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default" | "secondary";
  className?: string;
}) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonStyle = `text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${
    size === "icon" ? "w-9 h-9 p-0 flex items-center justify-center" : "gap-2"
  } ${className}`;

  if (!mounted) {
    return (
      <Button variant={variant} size={size} className={buttonStyle} disabled aria-label="Toggle theme">
        <Sun size={ICON_SIZE} className="text-muted-foreground opacity-50" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant={variant}
      size={size}
      className={buttonStyle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle light and dark mode"
    >
      {isDark ? (
        <Sun size={ICON_SIZE} className="text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon size={ICON_SIZE} className="text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </Button>
  );
};
