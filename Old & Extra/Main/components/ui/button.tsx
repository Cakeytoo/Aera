import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
}

export function Button({ children, variant = "default", className = "", ...props }: ButtonProps) {
  let styles = "px-4 py-2 rounded-md font-medium transition";

  if (variant === "default") {
    styles += " bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "secondary") {
    styles += " bg-gray-200 text-gray-900 hover:bg-gray-300";
  } else if (variant === "ghost") {
    styles += " bg-transparent text-gray-700 hover:bg-gray-100";
  }

  return (
    <button {...props} className={`${styles} ${className}`}>
      {children}
    </button>
  );
}
