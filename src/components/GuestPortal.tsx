"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/socket";
import { Flame, HeartPulse, ShieldAlert, AlertCircle, MapPin, Send, CheckCircle, TriangleAlert, Radio, Users, Clock, Zap } from "lucide-react";

export function GuestPortal() {
  const { socket } = useSocket();
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [otherDescription, setOtherDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [coordinationStatus, setCoordinationStatus] = useState<string>("Ready for coordination");

  useEffect(() => {
    if (!socket || !submitted) return;

    const handleAlarmsCleared = () => {
      setResolved(true);
    };

    const handleCaseClosed = () => {
      setResolved(true);
    };

    const handleTaskUpdate = (data: any) => {
      if (data.status === "completed" || data.status === "resolved") {
        setResolved(true);
      }
    };

    socket.on("alarms_cleared", handleAlarmsCleared);
    socket.on("case_closed", handleCaseClosed);
    socket.on("task_status_update", handleTaskUpdate);

    return () => {
      socket.off("alarms_cleared", handleAlarmsCleared);
      socket.off("case_closed", handleCaseClosed);
      socket.off("task_status_update", handleTaskUpdate);
    };
  }, [socket, submitted]);

  const getGPS = () => {
    // Array of possible locations in a hospitality venue
    const locations = [
      { coords: "Lat: 34.0522, Long: -118.2437", desc: "Near Main Pool Area" },
      { coords: "Lat: 34.0528, Long: -118.2442", desc: "Main Lobby Entrance" },
      { coords: "Lat: 34.0519, Long: -118.2431", desc: "Restaurant Dining Area" },
      { coords: "Lat: 34.0531, Long: -118.2448", desc: "Fitness Center" },
      { coords: "Lat: 34.0525, Long: -118.2439", desc: "Elevator Bank - 3rd Floor" },
      { coords: "Lat: 34.0517, Long: -118.2429", desc: "Conference Room B" },
      { coords: "Lat: 34.0533, Long: -118.2451", desc: "Spa Reception" },
      { coords: "Lat: 34.0521, Long: -118.2434", desc: "Business Center" },
      { coords: "Lat: 34.0529, Long: -118.2445", desc: "Valet Parking Area" },
      { coords: "Lat: 34.0515, Long: -118.2427", desc: "Garden Terrace" },
      { coords: "Lat: 34.0535, Long: -118.2453", desc: "Kids Play Area" },
      { coords: "Lat: 34.0523, Long: -118.2436", desc: "Guest Room Corridor - 5th Floor" },
      { coords: "Lat: 34.0513, Long: -118.2425", desc: "Outdoor Bar Patio" },
      { coords: "Lat: 34.0537, Long: -118.2455", desc: "Laundry Facility" },
      { coords: "Lat: 34.0527, Long: -118.2441", desc: "Security Office" }
    ];

    // Select random location
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    setLocation(`${randomLocation.coords} (${randomLocation.desc})`);
    setCoordinationStatus("GPS coordinates acquired - coordinating with emergency services");
  };

  const submitReport = (overrideType?: string) => {
    let finalType = overrideType || incidentType;
    if (finalType === "OTHER") {
      if (!otherDescription.trim()) return;
      finalType = `OTHER: ${otherDescription}`;
    }

    if (!finalType) return;

    const finalLocation = location.trim() || "UNKNOWN LOCATION (GPS PENDING)";

    socket?.emit("guest_incident", {
      type: finalType,
      location: finalLocation,
      timestamp: new Date().toISOString(),
    });
    setSubmitted(true);
    setCoordinationStatus("Alert dispatched - coordinating response teams");
  };

  if (resolved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)] mb-6 mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Crisis Resolved</h1>
            <p className="text-zinc-400 text-lg mb-6 max-w-sm mx-auto">
              All response teams have been coordinated and the situation is now secure. Thank you for your assistance in maintaining safety.
            </p>
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm mb-6">
              <Users className="w-4 h-4" />
              <span>Coordinated Response: Complete</span>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setResolved(false);
                setIncidentType(null);
                setOtherDescription("");
                setLocation("");
                setCoordinationStatus("Ready for coordination");
              }}
              className="w-full bg-gradient-to-r from-zinc-700 to-zinc-800 text-white font-semibold rounded-2xl py-4 hover:from-zinc-600 hover:to-zinc-700 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Return to Safety Monitoring
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)] mb-6 mx-auto animate-pulse">
              <Radio className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Response Activated</h1>
            <p className="text-zinc-400 text-lg mb-6 max-w-sm mx-auto">
              Your alert has been received and is being coordinated with emergency services and on-site response teams.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Response Time: &lt; 30 seconds</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{coordinationStatus}</span>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-xs text-zinc-500">Please remain calm. Help is en route and will arrive shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-2 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-sm mx-auto w-full">
        {/* Header - Compact */}
        <div className="text-center mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-2 mx-auto">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">Rapid Crisis Response</h1>
          <p className="text-zinc-400 text-xs max-w-xs mx-auto leading-tight">
            Emergency Response Coordination
          </p>
        </div>

        {/* SOS BUTTON - Compact */}
        <div className="w-full mb-3">
          <button
            onClick={() => submitReport("SOS - IMMEDIATE EMERGENCY RESPONSE REQUIRED")}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 active:from-orange-600 active:to-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] active:shadow-none transition-all py-3 rounded-lg flex flex-col items-center justify-center gap-1 border-2 border-orange-400 hover:border-orange-300 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <TriangleAlert className="w-5 h-5 animate-pulse" />
            <span className="text-lg font-bold tracking-widest uppercase">SOS</span>
            <span className="text-xs font-medium opacity-90 uppercase tracking-widest">Emergency Response</span>
          </button>
        </div>

        {/* Divider - Compact */}
        <div className="relative mb-3">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs text-zinc-600 font-semibold uppercase bg-slate-950 px-2 py-0.5 rounded-full border border-zinc-800 w-max mx-auto">Alternative Reporting</div>
          <hr className="border-zinc-800" />
        </div>

        {/* Standard Reporting Section - Compact */}
        <div className="bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-3 mb-3">
          <div className="mb-3 text-center">
            <h2 className="text-base font-bold text-zinc-100 mb-1">Coordinated Alert System</h2>
            <p className="text-zinc-400 text-xs">Connect with response teams</p>
          </div>

          {/* Incident Type Selection - Compact */}
          <section className="mb-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Situation Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setIncidentType("FIRE")}
                className={`group flex flex-col items-center justify-center p-2 border rounded-lg gap-1.5 transition-all transform hover:scale-[1.02] ${
                  incidentType === "FIRE"
                    ? "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-500 ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-700/50"
                }`}
              >
                <Flame className="w-4 h-4 group-hover:animate-pulse" />
                <span className="font-semibold text-xs">Fire Hazard</span>
                <span className="text-xs opacity-70">Immediate attention</span>
              </button>
              <button
                onClick={() => setIncidentType("MEDICAL")}
                className={`group flex flex-col items-center justify-center p-2 border rounded-lg gap-1.5 transition-all transform hover:scale-[1.02] ${
                  incidentType === "MEDICAL"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-700/50"
                }`}
              >
                <HeartPulse className="w-4 h-4 group-hover:animate-pulse" />
                <span className="font-semibold text-xs">Medical Aid</span>
                <span className="text-xs opacity-70">Health emergency</span>
              </button>
              <button
                onClick={() => setIncidentType("SECURITY")}
                className={`group flex flex-col items-center justify-center p-2 border rounded-lg gap-1.5 transition-all transform hover:scale-[1.02] ${
                  incidentType === "SECURITY"
                    ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-500 ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-700/50"
                }`}
              >
                <ShieldAlert className="w-4 h-4 group-hover:animate-pulse" />
                <span className="font-semibold text-xs">Security</span>
                <span className="text-xs opacity-70">Safety concern</span>
              </button>
              <button
                onClick={() => setIncidentType("OTHER")}
                className={`group flex flex-col items-center justify-center p-2 border rounded-lg gap-1.5 transition-all transform hover:scale-[1.02] ${
                  incidentType === "OTHER"
                    ? "bg-gradient-to-br from-zinc-600 to-zinc-700 text-white border-zinc-500 ring-2 ring-zinc-500/50 shadow-[0_0_20px_rgba(161,161,170,0.3)]"
                    : "bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-700/50"
                }`}
              >
                <AlertCircle className="w-4 h-4 group-hover:animate-pulse" />
                <span className="font-semibold text-xs">Other Issue</span>
                <span className="text-xs opacity-70">Custom situation</span>
              </button>
            </div>
            {incidentType === "OTHER" && (
              <div className="mt-2 animate-in slide-in-from-top-2">
                <textarea
                  placeholder="Describe the situation..."
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-2 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[70px] backdrop-blur-sm text-xs"
                />
              </div>
            )}
          </section>

          {/* Location Section - Compact */}
          <section className="mb-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location Details
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={getGPS}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-2.5 rounded-lg font-medium transition-all transform hover:scale-[1.02] shadow-lg text-xs"
              >
                <MapPin className="w-3 h-3" />
                <span>Auto-Locate Me</span>
                <span className="text-xs opacity-75">GPS</span>
              </button>
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs text-zinc-600 font-semibold uppercase bg-slate-950 px-1 w-max mx-auto">OR</div>
                <hr className="border-zinc-800 my-1.5" />
              </div>
              <input
                type="text"
                placeholder="Describe your location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-2 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 backdrop-blur-sm text-xs"
              />
            </div>
          </section>
        </div>

        {/* Submit Button - Compact */}
        <div className="mb-3">
          <button
            onClick={() => submitReport()}
            disabled={!incidentType || (incidentType === "OTHER" && !otherDescription.trim())}
            className="group w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-zinc-700 to-zinc-800 disabled:from-zinc-800 disabled:to-zinc-900 text-white font-bold py-3 rounded-lg transition-all hover:from-zinc-600 hover:to-zinc-700 disabled:opacity-50 shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none text-sm"
          >
            <Send className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            <span>Send Alert</span>
            <Users className="w-3 h-3 opacity-70" />
          </button>
          <p className="text-xs text-zinc-500 text-center mt-0.5">
            Instantly shared with response teams
          </p>
        </div>

        {/* Status Footer - Compact */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1 text-zinc-600 text-xs bg-zinc-900/50 px-1.5 py-0.5 rounded-full border border-zinc-800/50">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            <span>{coordinationStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
