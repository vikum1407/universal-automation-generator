import React from "react";

export function Card({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        card rounded-card shadow-card p-4 border
        transition-colors duration-200
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
