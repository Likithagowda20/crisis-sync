"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/lib/socket";
import { Send, AlertTriangle, Info, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: "info" | "alert" | "system";
  timestamp: string;
}

export function IncidentChat() {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("iot_alert", (alert: any) => {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "SYSTEM",
        text: `CRITICAL ALERT: ${alert.type.toUpperCase()} DETECTED in ${alert.location}`,
        type: "alert",
        timestamp: alert.timestamp,
      };
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("system_command", (cmd: any) => {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "COMMAND CENTER",
        text: cmd.text || `Executed Command: ${cmd.action}`,
        type: "system",
        timestamp: cmd.timestamp || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("alarms_cleared", () => {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: "COMMAND CENTER",
        text: "ALL ALARMS CLEARED OR RESOLVED.",
        type: "info",
        timestamp: new Date().toISOString()
      };
       setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat_message");
      socket.off("iot_alert");
      socket.off("system_command");
      socket.off("alarms_cleared");
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const newMsg = {
      id: Math.random().toString(36).substring(7),
      sender: "Staff Member", // In a real app this would come from auth
      text: input,
      type: "info",
    };

    socket.emit("chat_message", newMsg);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden relative">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur top-0 z-10 flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          Incident Log
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-zinc-400">{isConnected ? "Connected" : "Reconnecting..."}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-10">No incidents reported yet. log is clear.</div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-1 p-3 rounded-lg border text-sm animate-in slide-in-from-bottom-2 ${
              m.type === "alert"
                ? "bg-red-950/30 border-red-900/50 text-red-50"
                : m.type === "system"
                ? "bg-amber-950/20 border-amber-900/50 text-amber-50"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-50"
            }`}
          >
            <div className="flex justify-between items-baseline opacity-80 text-xs">
              <span className="font-semibold">{m.sender}</span>
              <span>{format(new Date(m.timestamp), "HH:mm:ss")}</span>
            </div>
            <div className="flex items-start gap-2">
              {m.type === "alert" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
              {m.type === "system" && <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{m.text}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type situation update..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
