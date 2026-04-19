"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { Map, AlertCircle, ShieldCheck, Waves, Utensils, Building2, Car, TreePine, Coffee, Dumbbell, Lock } from "lucide-react";

interface FacilityArea {
  id: string;
  name: string;
  status: "safe" | "warning" | "critical";
  type: "smoke" | "intrusion" | "panic" | "medical" | "none";
  icon: any;
  category: "amenity" | "service" | "guest" | "operational";
  aliases?: string[];
}

const facilityAreas: FacilityArea[] = [
  // Amenities
  { id: "pool_main", name: "Main Pool Area", status: "safe", type: "none", icon: Waves, category: "amenity" },
  { id: "pool_kids", name: "Children's Pool", status: "safe", type: "none", icon: Waves, category: "amenity" },
  { id: "spa", name: "Spa & Wellness", status: "safe", type: "none", icon: Coffee, category: "amenity", aliases: ["spa reception", "wellness spa"] },
  { id: "fitness", name: "Fitness Center", status: "safe", type: "none", icon: Dumbbell, category: "amenity" },
  { id: "garden", name: "Garden Terrace", status: "safe", type: "none", icon: TreePine, category: "amenity" },

  // Service Areas
  { id: "lobby_main", name: "Main Lobby", status: "safe", type: "none", icon: Building2, category: "service" },
  { id: "restaurant", name: "Main Restaurant", status: "safe", type: "none", icon: Utensils, category: "service", aliases: ["restaurant dining area"] },
  { id: "bar_pool", name: "Pool Bar", status: "safe", type: "none", icon: Coffee, category: "service", aliases: ["outdoor bar patio", "bar patio"] },
  { id: "outdoor_bar_patio", name: "Outdoor Bar Patio", status: "safe", type: "none", icon: Coffee, category: "service", aliases: ["outdoor bar patio", "bar patio"] },
  { id: "concierge", name: "Concierge Desk", status: "safe", type: "none", icon: Building2, category: "service" },
  { id: "business_center", name: "Business Center", status: "safe", type: "none", icon: Building2, category: "service", aliases: ["business center"] },
  { id: "conference_b", name: "Conference Room B", status: "safe", type: "none", icon: Building2, category: "service", aliases: ["conference room b"] },

  // Guest Areas (by floor)
  // Guest Areas (by floor)
  { id: "floor_3", name: "Guest Floor 3", status: "safe", type: "none", icon: Building2, category: "guest", aliases: ["room 30", "3rd floor", "corridor - 3rd floor"] },
  { id: "floor_4", name: "Guest Floor 4", status: "safe", type: "none", icon: Building2, category: "guest", aliases: ["room 40", "4th floor", "corridor - 4th floor"] },
  { id: "floor_5", name: "Guest Floor 5", status: "safe", type: "none", icon: Building2, category: "guest", aliases: ["room 50", "5th floor", "corridor - 5th floor"] },
  { id: "floor_6", name: "Guest Floor 6", status: "safe", type: "none", icon: Building2, category: "guest", aliases: ["room 60", "6th floor", "corridor - 6th floor"] },

  // Operational Areas
  { id: "parking", name: "Valet Parking", status: "safe", type: "none", icon: Car, category: "operational", aliases: ["parking area", "valet"] },
  { id: "security", name: "Security Office", status: "safe", type: "none", icon: ShieldCheck, category: "operational" },
  { id: "elevator_bank", name: "Elevator Bank", status: "safe", type: "none", icon: Building2, category: "operational", aliases: ["elevator"] },
  { id: "laundry", name: "Laundry Facility", status: "safe", type: "none", icon: Building2, category: "operational" },
  { id: "maintenance", name: "Maintenance", status: "safe", type: "none", icon: Building2, category: "operational" },
];

export function BuildingMap() {
  const { socket } = useSocket();
  const [areas, setAreas] = useState<FacilityArea[]>(facilityAreas);

  const resetAreas = () => setAreas(facilityAreas.map(area => ({ ...area, status: "safe" })));
  
  const clearAreaByLocation = (locationRaw: string) => {
    setAreas(prev => prev.map(area => {
      if (matchAreaLocation(area, locationRaw)) {
        return { ...area, status: "safe" };
      }
      return area;
    }));
  };

  const matchAreaLocation = (area: FacilityArea, locationRaw: string) => {
    if (!locationRaw) return false;
    const location = locationRaw.toLowerCase();
    const areaName = area.name.toLowerCase();
    const areaId = area.id.replace(/_/g, ' ').toLowerCase();
    const areaAliases = (area.aliases || []).map((alias) => alias.toLowerCase());

    // Strategy 1: Direct inclusions
    let isMatch = location.includes(areaName) || 
                  location.includes(areaId) || 
                  areaAliases.some(alias => location.includes(alias));

    // Strategy 2: If the location has a "(description)" part (common in GPS alerts)
    const descMatch = location.match(/\(([^)]+)\)/);
    if (descMatch) {
      const description = descMatch[1].toLowerCase();
      isMatch = isMatch || 
                 description.includes(areaName) || 
                 description.includes(areaId) ||
                 areaAliases.some(alias => description.includes(alias));
    }

    // Strategy 3: Guest room specifics (e.g., "Room 305" matches "Floor 3")
    if (area.category === 'guest') {
      const floorDigits = area.id.match(/\d+/);
      if (floorDigits) {
        const floorNum = floorDigits[0];
        // Match "Room 3xx" or "3rd Floor"
        isMatch = isMatch || 
                   location.includes(`room ${floorNum}`) || 
                   location.includes(`floor ${floorNum}`) ||
                   location.includes(`${floorNum}th floor`);
      }
    }

    return isMatch;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("iot_alert", (alert: any) => {
       setAreas(prev => prev.map(area => {
          if (matchAreaLocation(area, alert.location || '')) {
             return { ...area, status: "critical", type: alert.type };
          }
          return area;
       }));
    });

    socket.on("pending_incident", (incident: any) => {
       setAreas(prev => prev.map(area => {
          if (matchAreaLocation(area, incident.location || '')) {
             return { ...area, status: "warning", type: incident.type };
          }
          return area;
       }));
    });

    socket.on("guest_incident", (incident: any) => {
       setAreas(prev => prev.map(area => {
          if (matchAreaLocation(area, incident.location || '')) {
             return { ...area, status: "critical", type: incident.type };
          }
          return area;
       }));
    });

    socket.on("alarms_cleared", resetAreas);
    socket.on("case_closed", (data) => {
       if (data.location) clearAreaByLocation(data.location);
       else resetAreas();
    });

    socket.on("task_status_update", (data) => {
       if ((data.status === "completed" || data.status === "resolved") && data.location) {
         clearAreaByLocation(data.location);
       }
    });

    return () => {
       socket.off("iot_alert");
       socket.off("pending_incident");
       socket.off("guest_incident");
       socket.off("alarms_cleared");
       socket.off("case_closed");
       socket.off("task_status_update");
    };
  }, [socket]);

  const activeAlerts = areas.filter(area => area.status !== "safe").length;

  const renderCategory = (title: string, category: string, Icon: any) => (
    <div className="mb-4">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <Icon className="w-3 h-3 text-zinc-600" />
        {title}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {areas.filter(a => a.category === category).map(area => {
          const AreaIcon = area.icon;
          const isCritical = area.status === 'critical';
          const isWarning = area.status === 'warning';
          
          return (
            <motion.div
              key={area.id}
              className={`relative p-2 rounded-lg border-2 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center
                ${area.status === 'safe' ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 shadow-sm' : ''}
                ${isCritical ? 'border-red-500 bg-red-900 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}
                ${isWarning ? 'border-amber-500 bg-amber-900 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' : ''}
              `}
              animate={area.status !== 'safe' ? {
                scale: [1, 1.05, 1],
                boxShadow: isCritical ? ["0 0 0px rgba(239,68,68,0)", "0 0 20px rgba(239,68,68,0.6)", "0 0 0px rgba(239,68,68,0)"] : []
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <AreaIcon className={`w-5 h-5 mb-1 ${area.status !== 'safe' ? 'text-white animate-pulse' : 'text-zinc-400'}`} />
              <div className="text-[10px] font-black leading-tight truncate w-full px-1 uppercase tracking-tighter">
                {area.name}
              </div>
              {isCritical && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-zinc-900/40 rounded-xl border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] h-full overflow-hidden backdrop-blur-sm">
      <div className="p-3 border-b border-zinc-700/50 flex justify-between items-center bg-zinc-800/40 backdrop-blur shrink-0">
        <h2 className="text-sm font-black flex items-center gap-2 text-white tracking-widest">
          <Map className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)]" />
          MISSION OVERVIEW
        </h2>
        <div>
          {activeAlerts > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse transition-all">
               {activeAlerts} ACTIVE ALERT{activeAlerts > 1 ? 'S' : ''}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
               SYSTEM NOMINAL
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {renderCategory("Amenities", "amenity", Waves)}
        {renderCategory("Services", "service", Utensils)}
        {renderCategory("Guest Floors", "guest", Lock)}
        {renderCategory("Operations", "operational", ShieldCheck)}
      </div>
    </div>
  );
}
