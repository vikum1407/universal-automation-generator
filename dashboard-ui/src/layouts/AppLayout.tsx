import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--fg)] transition-colors duration-300">
      <Sidebar open={open} setOpen={setOpen} />

      <div
        className={`
          flex flex-col flex-1 overflow-hidden transition-all duration-300
          ${open ? "ml-64" : "ml-20"}
        `}
      >
        <Header />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
