"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/lib/socket";
import { 
  ShieldAlert, BellRing, PhoneCall, CheckCircle, Activity, 
  Users, Siren, Zap, Thermometer, MessageSquare, AlertTriangle,
  X, ShieldCheck, Radio
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityLog } from "./ActivityLog";

interface Notification {
  id: string;
  type: "success" | "alert" | "info";
  title: string;
  message: string;
}

export function CommandCenter() {
  const { socket } = useSocket();
  const [isDrill, setIsDrill] = useState(false);
  const [pendingIncidents, setPendingIncidents] = useState<any[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeDirective, setActiveDirective] = useState<string | null>(null);

  const addNotification = (title: string, message: string, type: Notification["type"] = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  useEffect(() => {
     if(!socket) return;
     socket.emit("check_drill_mode");
     socket.on("drill_mode_status", (status) => setIsDrill(status));
     
     socket.on("pending_incident", (incident) => {
       setPendingIncidents(prev => [...prev, incident]);
     });
     
     socket.on("task_assigned", (data) => {
       setPendingIncidents(prev => prev.filter(inc => inc.id !== data.incidentId));
     });

     // FIX: Listen to assigned_task to show it in Field Units immediately
     socket.on("assigned_task", (task) => {
       setAssignedTasks(prev => {
         // Avoid duplicates if already added by status update
         if (prev.some(t => t.id === task.id)) return prev;
         return [{ ...task, status: "dispatched" }, ...prev];
       });
       addNotification("Unit Dispatched", `${task.assignedTo} moving to ${task.location}`, "info");
     });
     
     socket.on("task_status_update", (update) => {
       setAssignedTasks(prev => prev.map(task => 
         task.id === update.taskId 
           ? { ...task, status: update.status, notes: update.notes, lastUpdate: new Date().toISOString() }
           : task
       ));

       if (update.status === "completed") {
         addNotification("Task Completed", `${update.assignedTo || 'Staff'} has successfully resolved: ${update.type}`, "success");
       }
     });

     socket.on("case_closed", (data) => {
       setAssignedTasks(prev => prev.map(task => 
         task.id === data.taskId 
           ? { ...task, status: 'closed', closedAt: new Date().toISOString() }
           : task
       ));
     });

     // Handle Global System Commands
     socket.on("system_command", (data) => {
       setActiveDirective(data.action);
       addNotification("System Protocol Change", `New Protocol: ${data.action.replace(/_/g, ' ')}`, "alert");
       
       // Handle auto-clear for evacuation
       if (data.action === "TRIGGER_GENERAL_EVACUATION") {
         setPendingIncidents([]);
       }
     });

     socket.on("alarms_cleared", () => {
       setPendingIncidents([]);
       setAssignedTasks([]);
       setActiveDirective(null);
     });
     
     return () => { 
       socket.off("drill_mode_status");
       socket.off("pending_incident");
       socket.off("task_assigned");
       socket.off("assigned_task");
       socket.off("task_status_update");
       socket.off("case_closed");
       socket.off("system_command");
       socket.off("alarms_cleared");
     };
  }, [socket]);

  const issueCommand = (action: string) => {
    if (!socket) return;
    setLoading(action);
    socket.emit("system_command", { action });
    setTimeout(() => setLoading(null), 800);
  };

  const clearAlarms = () => {
     if(!socket) return;
     socket.emit("clear_alarms");
  }

  const toggleDrill = () => {
     if(!socket) return;
     socket.emit("drill_mode_toggle", !isDrill);
  }

  const assignTask = (incidentId: string, teamType: string) => {
    if (!socket) return;
    socket.emit("assign_task", { incidentId, teamType });
  }

  const closeCase = (taskId: string) => {
    if (!socket) return;
    socket.emit("close_case", { taskId });
  }

  return (
    <div className={`flex flex-col h-full gap-4 relative overflow-hidden transition-all duration-700 ${activeDirective === 'TRIGGER_GENERAL_EVACUATION' ? 'ring-inset ring-8 ring-red-600/20' : ''}`}>
      {/* Notifications Portal */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-80">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`p-4 rounded-xl border-2 shadow-2xl pointer-events-auto flex gap-3 backdrop-blur-xl
                ${n.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-50' : 
                  n.type === 'alert' ? 'bg-red-950/80 border-red-500/50 text-red-50' : 
                  'bg-indigo-950/80 border-indigo-500/50 text-indigo-50'}
              `}
            >
              {n.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <div>
                <div className="text-xs font-black uppercase tracking-widest mb-0.5">{n.title}</div>
                <div className="text-sm opacity-90 leading-tight">{n.message}</div>
              </div>
              <button onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} className="ml-auto">
                <X className="w-3 h-3 opacity-50 hover:opacity-100" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Console Grid: Decoupled columns to prevent stretching */}
      <div className="flex flex-row gap-4 h-full min-h-0">
        
        {/* LEFT COLUMN: Threat Monitor & Strategic Directives */}
        <div className="flex flex-col gap-4 w-1/2 h-full min-h-0">
          {/* Active Threat Monitor */}
          <div className="flex flex-col bg-zinc-900/60 rounded-xl border border-zinc-800 p-3 overflow-hidden h-1/2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Siren className="w-3 h-3 text-red-500" />
                Threat Queue
              </h3>
              <div className="flex gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isDrill ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {pendingIncidents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-2 py-4">
                  <CheckCircle className="w-8 h-8 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">No Active Threats</span>
                </div>
              )}
              {pendingIncidents.map((incident) => (
                <div key={incident.id} className="bg-red-950/20 border border-red-900/40 rounded p-2 flex items-center justify-between group">
                  <div>
                    <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      {incident.type}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono tracking-tighter">LOC: {incident.location}</div>
                  </div>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => assignTask(incident.id, "Medical Team")} className="p-1 rounded bg-blue-900/40 hover:bg-blue-600 text-[8px] font-bold">MED</button>
                    <button onClick={() => assignTask(incident.id, "Fire Team")} className="p-1 rounded bg-red-900/40 hover:bg-red-600 text-[8px] font-bold">FIRE</button>
                    <button onClick={() => assignTask(incident.id, "Security Team")} className="p-1 rounded bg-amber-900/40 hover:bg-amber-600 text-[8px] font-bold">SEC</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Actions - Stays compact */}
          <div className="flex flex-col bg-zinc-900/40 rounded-xl border border-zinc-800/80 p-4 h-fit">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              STRATEGIC DIRECTIVES
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => issueCommand("TRIGGER_GENERAL_EVACUATION")}
                className={`h-20 flex flex-col items-center justify-center rounded-lg border-2 transition-all active:scale-95 ${activeDirective === "TRIGGER_GENERAL_EVACUATION" ? "bg-red-600 border-white shadow-[0_0_20px_white]" : "bg-red-950/30 border-red-900/50 hover:bg-red-700 hover:text-white text-red-500 opacity-60"}`}
              >
                <BellRing className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">General Evacuation</span>
              </button>
              <button 
                 onClick={() => issueCommand("DISPATCH_EMERGENCY_SERVICES")}
                 className={`h-20 flex flex-col items-center justify-center rounded-lg border-2 transition-all font-bold ${activeDirective === "DISPATCH_EMERGENCY_SERVICES" ? "bg-blue-600 border-white" : "border-blue-900/50 bg-blue-950/30 hover:bg-blue-700 hover:text-white text-blue-500 opacity-60"}`}
              >
                <PhoneCall className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Call External</span>
              </button>
              <button 
                onClick={() => issueCommand("LOCKDOWN_INITIATED")}
                className={`h-20 flex flex-col items-center justify-center rounded-lg border-2 transition-all font-bold ${activeDirective === "LOCKDOWN_INITIATED" ? "bg-amber-600 border-white" : "border-amber-900/50 bg-amber-950/30 hover:bg-amber-700 hover:text-white text-amber-500 opacity-60"}`}
              >
                <ShieldAlert className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Lockdown Area</span>
              </button>
              <button 
                onClick={clearAlarms}
                className="h-20 flex flex-col items-center justify-center rounded-lg border-2 border-emerald-900/50 bg-emerald-950/30 hover:bg-emerald-600 hover:text-white text-emerald-500 transition-all font-bold"
              >
                <CheckCircle className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">All Clear</span>
              </button>
            </div>
            <button
                onClick={toggleDrill}
                className={`mt-4 w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] border-2 transition-all shadow-lg ${
                  isDrill ? "bg-amber-500 text-black border-amber-400" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
                }`}
            >
               {isDrill ? "DISENGAGE DRILL" : "INITIALIZE DRILL SEQUENCE"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Field Units & Tactical Feed */}
        <div className="flex flex-col gap-4 w-1/2 h-full min-h-0">
          
          {/* ACTIVE DIRECTIVE STATUS BANNER */}
          {activeDirective && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className={`p-2 rounded border bg-red-950/40 border-red-500 flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse`}
            >
              <div className="flex items-center gap-2">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-200">
                  ACTIVE PROTOCOL: {activeDirective.replace(/_/g, ' ')}
                </span>
              </div>
              <Activity className="w-3 h-3 text-red-500" />
            </motion.div>
          )}

          {/* Team Status - Takes about 1/3 height or enough for content */}
          <div className="flex flex-col bg-zinc-900/60 rounded-xl border border-zinc-800 p-3 overflow-hidden h-1/3">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-indigo-500" />
              Field Units
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
              {assignedTasks.length === 0 && (
                <div className="h-full flex items-center justify-center text-zinc-700 text-[9px] font-bold opacity-50 uppercase tracking-widest">
                  All Units Stand-by
                </div>
              )}
              {assignedTasks.map((task) => (
                <div key={task.id} className={`p-2 rounded border flex items-center justify-between ${
                  task.status === 'completed' ? 'bg-emerald-950/10 border-emerald-900/30' : 
                  task.status === 'closed' ? 'opacity-40 grayscale border-zinc-800' : 'bg-indigo-950/10 border-indigo-900/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'in_progress' ? 'bg-indigo-500 animate-pulse' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <div>
                      <div className="text-[10px] font-bold text-zinc-300">{task.assignedTo}</div>
                      <div className="text-[8px] text-zinc-500 uppercase">{task.type} @ {task.location}</div>
                      {task.status === 'dispatched' && <div className="text-[7px] text-yellow-500 font-bold tracking-widest uppercase">DISPATCHED (En-route)</div>}
                    </div>
                  </div>
                  {task.status === 'completed' && (
                    <button onClick={() => closeCase(task.id)} className="px-2 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-black uppercase">Close</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed - Flexes to fill remaining space */}
          <div className="flex-1 min-h-0 shrink">
            <ActivityLog />
          </div>
        </div>

      </div>
    </div>
  );
}
