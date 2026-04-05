import React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  height: number;
};

export function Skeleton({ height, className = "", ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      className={`
        animate-pulse rounded-card
        bg-neutral-light dark:bg-slate-700
        ${className}
      `}
      style={{ height, ...(props.style || {}) }}
    />
  );
}
