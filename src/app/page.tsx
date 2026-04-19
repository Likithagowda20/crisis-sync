"use client";

import { useState } from "react";
import { BuildingMap } from "@/components/BuildingMap";
import { CommandCenter } from "@/components/CommandCenter";
import { StaffDashboard } from "@/components/StaffDashboard";
import { Login } from "@/components/Login";
import { GuestPortal } from "@/components/GuestPortal";

export default function Home() {
  const [role, setRole] = useState<"commander" | "staff" | "guest" | null>(null);

  if (!role) {
    return <Login onLogin={(r) => setRole(r)} />;
  }

  if (role === "guest") {
    return <GuestPortal />;
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-black p-4 lg:p-6 font-sans">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="m20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/></svg>
             </div>
             CrisisSync
          </h1>
          <p className="text-zinc-500 mt-1 text-sm font-medium">Hospitality Emergency Response Coordination</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white uppercase tracking-wider">{role}</span>
              <span className="text-xs text-zinc-500">System Node</span>
           </div>
           <div className={`w-10 h-10 rounded-full border-2 border-zinc-700 flex items-center justify-center text-sm font-bold ${role === 'commander' ? 'bg-red-900 text-red-50' : role === 'staff' ? 'bg-amber-900 text-amber-50' : 'bg-indigo-900 text-indigo-50'}`}>
              {role === 'commander' ? 'C' : role === 'staff' ? 'S' : 'G'}
           </div>
           <button onClick={() => setRole(null)} className="ml-2 text-xs text-zinc-500 hover:text-white underline underline-offset-4">Sign out</button>
        </div>
      </header>

      {role === "staff" ? (
        // Staff View
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <StaffDashboard />
          </div>
        </div>
      ) : (
        // Commander View (Mission Control)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Building Map (Primary View) */}
          <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
             <BuildingMap />
          </div>

          {/* Right Column: Tactical Control & Activity */}
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
            <CommandCenter />
          </div>
        </div>
      )}
    </main>
  );
}
