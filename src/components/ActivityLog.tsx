"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/lib/socket";
import { Clock, Info, ShieldAlert, CheckCircle, Activity, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "alert" | "success" | "system";
  message: string;
  source: string;
}

export function ActivityLog() {
  const { socket } = useSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry["type"] = "info", source: string = "System") => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      source
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 50));
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for events to log
    socket.on("iot_alert", (alert) => {
      addLog(`IOT ALERT: ${alert.type} detected at ${alert.location}`, "alert", "Sensor-IoT");
    });

    socket.on("pending_incident", (incident) => {
      addLog(`INCIDENT: ${incident.type} reported in ${incident.location}`, "alert", "Intake");
    });

    socket.on("task_assigned", (data) => {
      addLog(`DISPATCH: ${data.teamType} assigned to ${data.type} at ${data.location}`, "system", "Dispatch");
    });

    socket.on("task_status_update", (data) => {
      const type = data.status === "completed" ? "success" : "info";
      addLog(`UPDATE: Task "${data.type}" ${data.status.replace('_', ' ')} ${data.notes ? `- ${data.notes}` : ''}`, type, "Field Team");
    });

    socket.on("case_closed", (data) => {
      addLog(`RESOLVED: Case ${data.taskId.split('-')[0]} closed by Commander`, "success", "Command");
    });

    socket.on("system_command", (data) => {
      addLog(`DIRECTIVE: ${data.action.replace(/_/g, ' ')} initiated`, "system", "Command");
    });

    socket.on("alarms_cleared", () => {
      addLog("SYSTEM: All alarms and tasks cleared. Standing down.", "success", "System");
    });

    // Initial log
    addLog("System initialized. Monitoring all nodes.", "system", "Kernel");

    return () => {
      socket.off("iot_alert");
      socket.off("pending_incident");
      socket.off("task_assigned");
      socket.off("task_status_update");
      socket.off("case_closed");
      socket.off("system_command");
      socket.off("alarms_cleared");
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden font-mono">
      <div className="p-2 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tactical Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLogs([])}
            className="text-[9px] text-zinc-500 hover:text-zinc-300 uppercase tracking-tighter transition-colors"
          >
            Clear Log
          </button>
          <div className="text-[9px] text-zinc-600 font-mono">LIVE // NO_LATENCY</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar text-[11px]" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-3 leading-relaxed border-l-2 pl-2 ${
                log.type === 'alert' ? 'border-red-500 text-red-100 bg-red-950/10' :
                log.type === 'success' ? 'border-emerald-500 text-emerald-100 bg-emerald-950/10' :
                log.type === 'system' ? 'border-indigo-500 text-indigo-200' :
                'border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="shrink-0 text-zinc-600 whitespace-nowrap">[{log.timestamp}]</div>
              <div className="flex-1">
                <span className="text-zinc-500 mr-2 uppercase text-[9px] font-bold tracking-tighter">[{log.source}]</span>
                <span className="break-words">{log.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-zinc-700 italic text-center py-4">Awaiting system signals...</div>
        )}
      </div>
    </div>
  );
}
