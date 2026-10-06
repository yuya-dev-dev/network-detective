import { useLayoutEffect, useState } from "react";

type Theme = "dark" | "white";
const key = "network-detective:theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(key) === "white" ? "white" : "dark";
    } catch {
      return "dark";
    }
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#090c10" : "#f5f7fa");
  }, [theme]);
  const toggle = () => {
    const next = theme === "dark" ? "white" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* Keep using the in-memory choice. */
    }
  };
  return { theme, toggle };
}
