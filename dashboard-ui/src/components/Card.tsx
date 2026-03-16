import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="
      bg-white 
      dark:bg-slate-800 
      text-gray-900 
      dark:text-slate-200 
      shadow-sm 
      rounded-lg 
      p-6 
      border 
      border-gray-100 
      dark:border-slate-700
    ">
      {children}
    </div>
  );
}
