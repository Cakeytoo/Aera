import * as React from "react";

export function Avatar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  return src ? <img src={src} alt={alt || "Avatar"} className="w-full h-full object-cover" /> : null;
}

export function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <span className="text-gray-600">{children}</span>;
}
