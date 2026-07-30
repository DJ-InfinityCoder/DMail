"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop, Palette } from "lucide-react";

export function AppearanceSettings() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">Customize how DMail looks on your device.</p>
          </div>
        </div>
        <div className="h-16 bg-muted/40 animate-pulse rounded-lg" />
      </div>
    );
  }

  const themes = [
    {
      id: "light",
      name: "Light",
      icon: Sun,
      color: "text-amber-500",
      description: "Clean bright theme",
    },
    {
      id: "dark",
      name: "Dark",
      icon: Moon,
      color: "text-slate-300",
      description: "Sleek dark theme",
    },
    {
      id: "system",
      name: "System",
      icon: Laptop,
      color: "text-muted-foreground",
      description: "Match system setting",
    },
  ];

  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">Customize how DMail looks on your device.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {themes.map((t) => {
          const Icon = t.icon;
          const isSelected = theme === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                flex flex-col items-start p-3.5 rounded-lg border text-left transition-all
                ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border hover:border-border/80 hover:bg-secondary/40"
                }
              `}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Icon className={`w-5 h-5 ${t.color}`} />
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="text-[11px] text-muted-foreground">{t.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
