"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/socket";
import { CheckCircle, ListTodo, ShieldAlert, CheckSquare } from "lucide-react";

interface PlaybookTask {
  id: string;
  text: string;
  completed: boolean;
}

const defaultFirePlaybook: PlaybookTask[] = [
  { id: "1", text: "Dispatch Security to Zone", completed: false },
  { id: "2", text: "Contact Local Fire Dept (911)", completed: false },
  { id: "3", text: "Trigger General Evac Alarm", completed: false },
  { id: "4", text: "Secure elevators to Ground Floor", completed: false },
  { id: "5", text: "Notify Floor Managers", completed: false },
];

export function CrisisPlaybook() {
  const { socket } = useSocket();
  const [active, setActive] = useState(false);
  const [tasks, setTasks] = useState<PlaybookTask[]>(defaultFirePlaybook);
  const [type, setType] = useState("");
  const [protocolCompleted, setProtocolCompleted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Automatically open playbook if a P1 incident happens
    socket.on("iot_alert", (alert: any) => {
      if (alert.priority === "P1" || alert.type === "smoke" || alert.type.includes("fire") || alert.type === "sos") {
        setActive(true);
        setType("Critical Fire / Medical");
        setProtocolCompleted(false);
        // reset tasks
        setTasks(defaultFirePlaybook.map(t => ({...t, completed: false})));
      }
    });

    socket.on("alarms_cleared", () => {
      setActive(false);
      setProtocolCompleted(false);
    });

    return () => {
      socket.off("iot_alert");
      socket.off("alarms_cleared");
    };
  }, [socket]);

  const markProtocolComplete = () => {
    setProtocolCompleted(true);
    setTasks(prev => prev.map(t => ({...t, completed: true})));
  };

  if (!active) {
    return (
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
         <ListTodo className="w-10 h-10 text-zinc-700 mb-3" />
         <h3 className="text-zinc-500 font-semibold mb-1">No Active Playbooks</h3>
         <p className="text-zinc-600 text-sm max-w-[200px]">Standard Operating Procedures will appear here automatically during a P1/P2 crisis.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-red-900/40 shadow-[0_0_15px_rgba(220,38,38,0.1)] p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 bg-red-950/50 border border-red-900 rounded-lg flex items-center justify-center">
           <ShieldAlert className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-red-500 uppercase tracking-widest text-sm flex items-center gap-2">
             Active SOP Playbook
          </h2>
          <p className="text-zinc-300 font-medium">{type} Protocol</p>
        </div>
      </div>

      {/* Protocol Steps List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Protocol Steps:</h3>
        {tasks.map((task, idx) => (
           <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
             <div className="flex items-center justify-center w-6 h-6 mt-0.5 shrink-0 rounded-full bg-zinc-700 text-zinc-400 text-xs font-bold">
               {idx + 1}
             </div>
             <span className="text-sm text-zinc-200 font-medium leading-relaxed">
                {task.text}
             </span>
           </div>
        ))}
      </div>

      {/* Complete Protocol Button */}
      {!protocolCompleted ? (
        <button
          onClick={markProtocolComplete}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <CheckSquare className="w-5 h-5" />
          Mark Protocol Complete
        </button>
      ) : (
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-400 text-sm font-semibold text-center animate-in fade-in zoom-in">
          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          Protocol Completed Successfully
        </div>
      )}
    </div>
  );
}
