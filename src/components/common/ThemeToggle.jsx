import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = ({
  className = "",
  showLabel = false,
  size = "md", // "sm" | "md" | "lg"
}) => {
  const { isDark, toggleTheme } = useTheme();

  const nextModeText = isDark ? "light" : "dark";
  const labelText = isDark ? "Switch to light mode" : "Switch to dark mode";

  const sizeClasses = {
    sm: "p-1.5 text-sm",
    md: "p-2 text-base",
    lg: "p-2.5 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      aria-label={labelText}
      title={labelText}
      data-testid="theme-toggle-btn"
    >
      {isDark ? (
        <FiSun
          className={`${iconSizes[size] || iconSizes.md} text-amber-400 hover:rotate-45 transition-transform duration-300`}
          aria-hidden="true"
        />
      ) : (
        <FiMoon
          className={`${iconSizes[size] || iconSizes.md} text-slate-700 hover:-rotate-12 transition-transform duration-300`}
          aria-hidden="true"
        />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-semibold capitalize">
          {nextModeText} Mode
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
