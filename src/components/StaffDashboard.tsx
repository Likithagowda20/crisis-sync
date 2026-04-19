"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/lib/socket";
import {
  ShieldAlert,
  BellRing,
  PhoneCall,
  CheckCircle,
  Activity,
  Users,
  MapPin,
  Radio,
  Clock,
  AlertTriangle,
  MessageSquare,
  Eye
} from "lucide-react";

export function StaffDashboard() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [pendingIncidents, setPendingIncidents] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [teamAssignments, setTeamAssignments] = useState<{[key: string]: {assignedAt: string, taskId: string, location: string, type: string, status: 'assigned' | 'unavailable' | 'completed'} | null}>({
    'Medical Team': null,
    'Fire Team': null,
    'Security Team': null,
    'Evacuation Team': null
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for pending incidents (for incident log)
    socket.on("pending_incident", (incident) => {
      setPendingIncidents(prev => [...prev, incident]);
      setLastUpdate(new Date());
    });

    // Listen for assigned tasks from commander
    socket.on("assigned_task", (task) => {
      setAssignedTasks(prev => [...prev, task]);
      // Remove from pending when assigned
      setPendingIncidents(prev => prev.filter(inc => inc.id !== task.id));
      // Track team assignment
      setTeamAssignments(prev => ({
        ...prev,
        [task.assignedTo]: {
          assignedAt: new Date().toLocaleTimeString(),
          taskId: task.id,
          location: task.location,
          type: task.type,
          status: 'assigned'
        }
      }));
      setLastUpdate(new Date());
    });

    // Listen for task status updates
    socket.on("task_status_update", (update) => {
      setAssignedTasks(prev => {
        const updatedTasks = prev.map(task => 
          task.id === update.taskId 
            ? { ...task, status: update.status, notes: update.notes, lastUpdate: new Date().toISOString() }
            : task
        );
        
        // Update team status when task starts
        if (update.status === "in_progress") {
          const task = updatedTasks.find(t => t.id === update.taskId);
          if (task) {
            setTeamAssignments(prevAssignments => ({
              ...prevAssignments,
              [task.assignedTo]: prevAssignments[task.assignedTo] ? {
                ...prevAssignments[task.assignedTo]!,
                status: 'unavailable'
              } : null
            }));
          }
        }
        // Clear team assignment when task completes
        if (update.status === "completed" || update.status === "resolved") {
          const task = updatedTasks.find(t => t.id === update.taskId);
          if (task) {
            setTeamAssignments(prevAssignments => ({
              ...prevAssignments,
              [task.assignedTo]: prevAssignments[task.assignedTo] ? {
                ...prevAssignments[task.assignedTo]!,
                status: 'completed'
              } : null
            }));
            // Clear the completed status after 3 seconds
            setTimeout(() => {
              setTeamAssignments(prevAssignments => ({
                ...prevAssignments,
                [task.assignedTo]: null
              }));
            }, 3000);
          }
        }
        
        return updatedTasks;
      });
      setLastUpdate(new Date());
    });

    // Listen for case closures
    socket.on("case_closed", (data) => {
      const closedTask = assignedTasks.find(task => task.id === data.taskId);
      setAssignedTasks(prev => prev.filter(task => task.id !== data.taskId));
      // Show completed status briefly before clearing
      if (closedTask) {
        setTeamAssignments(prev => ({
          ...prev,
          [closedTask.assignedTo]: prev[closedTask.assignedTo] ? {
            ...prev[closedTask.assignedTo]!,
            status: 'completed'
          } : null
        }));
        // Clear after 3 seconds
        setTimeout(() => {
          setTeamAssignments(prev => ({
            ...prev,
            [closedTask.assignedTo]: null
          }));
        }, 3000);
      }
      setLastUpdate(new Date());
    });

    // Clear tasks when resolved
    socket.on("alarms_cleared", () => {
      setAssignedTasks([]);
      setPendingIncidents([]);
      setTeamAssignments({
        'Medical Team': null,
        'Fire Team': null,
        'Security Team': null,
        'Evacuation Team': null
      });
      setLastUpdate(new Date());
    });

    return () => {
      socket.off("pending_incident");
      socket.off("assigned_task");
      socket.off("task_status_update");
      socket.off("case_closed");
      socket.off("alarms_cleared");
    };
  }, [socket]);

  const issueCommand = (action: string) => {
    if (!socket) return;
    setLoading(true);
    socket.emit("system_command", { action });
    setTimeout(() => setLoading(false), 500);
  };

  const clearIncidents = () => {
    if (!socket) return;
    socket.emit("clear_alarms");
  };

  const acknowledgeIncident = (incidentId: number) => {
    setAssignedTasks(prev => prev.filter(inc => inc.id !== incidentId));
  };

  const updateTaskStatus = (taskId: string, status: string, notes?: string) => {
    if (!socket) return;
    socket.emit("update_task_status", { taskId, status, notes });
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl border border-zinc-800 shadow-2xl p-6 flex flex-col gap-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
              Staff Operations Center
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Execute assigned tasks and coordinate field response.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Pending Incidents</span>
            </div>
            <div className="text-2xl font-bold text-white">{pendingIncidents.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-zinc-400 uppercase tracking-wider">My Tasks</span>
            </div>
            <div className="text-2xl font-bold text-white">{assignedTasks.length}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Completed</span>
            </div>
            <div className="text-2xl font-bold text-white">{assignedTasks.filter(t => t.status === 'completed').length}</div>
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      {assignedTasks.length > 0 && (
        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            My Assigned Tasks
          </h3>
          <div className="space-y-2">
            {assignedTasks.map((task) => (
              <div key={task.id} className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                      task.status === 'completed' ? 'bg-green-500' :
                      'bg-yellow-500 animate-pulse'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-blue-400">{task.type}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {task.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {task.status !== 'completed' && task.status !== 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "in_progress")}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">In Progress</span>
                    )}
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, "completed", "Task completed successfully")}
                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Done</span>
                    )}
                  </div>
                </div>
                {task.status === 'in_progress' && (
                  <div className="text-xs text-zinc-500 mt-2">
                    Status: In Progress - Go to location and assist
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Assignment Status */}
      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Team Assignment Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(teamAssignments).map(([teamName, assignment]) => {
            const isAssigned = assignment !== null;
            const isUnavailable = assignment?.status === 'unavailable';
            const isCompleted = assignment?.status === 'completed';
            const colors = teamName.includes('Medical') ? 'blue' : 
                          teamName.includes('Fire') ? 'red' : 
                          teamName.includes('Security') ? 'amber' : 'purple';
            const borderColor = `border-${colors}-900/50`;
            const bgColor = `bg-${colors}-950/20`;
            const textColor = `text-${colors}-500`;
            
            return (
              <div key={teamName} className={`flex flex-col p-3 border rounded-lg gap-2 transition-all ${
                isUnavailable 
                  ? `${borderColor} ${bgColor} ${textColor} ring-1 ring-${colors}-500/20` 
                  : isCompleted
                  ? `border-green-900/50 bg-green-950/20 text-green-500 ring-1 ring-green-500/20`
                  : isAssigned 
                  ? `border-yellow-900/50 bg-yellow-950/20 text-yellow-500 ring-1 ring-yellow-500/20`
                  : `border-zinc-700/50 bg-zinc-800/30 text-zinc-400`
              }`}>
                <div className="text-sm font-semibold">{teamName}</div>
                {isUnavailable ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-zinc-300">Working</span>
                    </div>
                    <div className="text-zinc-400">
                      <div>📍 {assignment.location}</div>
                      <div>🕐 {assignment.assignedAt}</div>
                    </div>
                  </div>
                ) : isCompleted ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-zinc-300">Task Completed</span>
                    </div>
                    <div className="text-zinc-400">
                      <div>📍 {assignment.location}</div>
                      <div>🕐 {assignment.assignedAt}</div>
                    </div>
                  </div>
                ) : isAssigned ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-zinc-300">Assigned - Ready to Start</span>
                    </div>
                    <div className="text-zinc-400">
                      <div>📍 {assignment.location}</div>
                      <div>🕐 {assignment.assignedAt}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Communication Status */}
      <div className="relative z-10 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Communication Status</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-400">Guest Portal Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-400">Team Comms Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}