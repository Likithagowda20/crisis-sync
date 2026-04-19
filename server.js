const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socket"
  });

  // Store pending incidents and assigned tasks globally for all connections
  let pendingIncidents = [];
  let assignedTasks = new Map(); // taskId -> {incident, assignedTo, status}

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("chat_message", (msg) => {
      // Broadcast to all
      io.emit("chat_message", { ...msg, timestamp: new Date().toISOString() });
    });

    socket.on("system_command", (cmd) => {
      io.emit("system_command", { ...cmd, timestamp: new Date().toISOString() });
    });

    let drillModeActive = false;

    socket.on("drill_mode_toggle", (isActive) => {
       drillModeActive = isActive;
       io.emit("drill_mode_status", drillModeActive);
    });

    socket.on("check_drill_mode", () => {
       socket.emit("drill_mode_status", drillModeActive);
    });

    // Option to clear alarms
    socket.on("clear_alarms", () => {
       io.emit("alarms_cleared");
    });

    // Commander assigns incident to team
    socket.on("assign_task", (data) => {
      const { incidentId, teamType } = data;
      const incident = pendingIncidents.find(inc => inc.id === incidentId);
      if (incident) {
        // Remove from pending
        pendingIncidents = pendingIncidents.filter(inc => inc.id !== incidentId);
        
        // Create assigned task
        const task = {
          ...incident,
          status: "assigned",
          assignedTo: teamType,
          assignedAt: new Date().toISOString()
        };
        
        assignedTasks.set(incidentId, task);
        
        // Send to all staff (they can filter by their team type)
        io.emit("assigned_task", task);
        
        // Notify commander that task was assigned
        io.emit("task_assigned", { incidentId, teamType });
        
        // Update chat log
        io.emit("chat_message", {
          id: Math.random().toString(36).substring(7),
          sender: "COMMAND CENTER",
          text: `Task assigned: ${incident.type} at ${incident.location} → ${teamType}`,
          type: "system",
          timestamp: new Date().toISOString()
        });
      }
    });

    // Commander closes case
    socket.on("close_case", (data) => {
      const { taskId } = data;
      const task = assignedTasks.get(taskId);
      if (task) {
        task.status = "closed";
        task.closedAt = new Date().toISOString();
        assignedTasks.set(taskId, task);
        
        // Notify all about case closure
        io.emit("case_closed", { taskId, location: task.location });
        
        // Update chat log
        io.emit("chat_message", {
          id: Math.random().toString(36).substring(7),
          sender: "COMMAND CENTER",
          text: `Case closed: ${task.type} at ${task.location} - Resolution complete`,
          type: "system",
          timestamp: new Date().toISOString()
        });
      }
    });

    // Staff updates task status
    socket.on("update_task_status", (data) => {
      const { taskId, status, notes } = data;
      const task = assignedTasks.get(taskId);
      if (task) {
        task.status = status;
        task.lastUpdate = new Date().toISOString();
        if (notes) task.notes = notes;
        
        assignedTasks.set(taskId, task);
        
        // Notify all about status update
        io.emit("task_status_update", { taskId, status, notes, location: task.location, type: task.type });
        
        // Update chat log
        io.emit("chat_message", {
          id: Math.random().toString(36).substring(7),
          sender: `STAFF ${task.assignedTo}`,
          text: `Task update: ${task.type} at ${task.location} - ${status}${notes ? ` (${notes})` : ''}`,
          type: "info",
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on("guest_incident", (data) => {
      // AI Triage Simulation
      const typeStr = data.type.toUpperCase();
      let priority = "P3"; 
      if (typeStr.includes("FIRE") || typeStr.includes("MEDICAL") || typeStr.includes("SOS") || typeStr.includes("GUN")) {
        priority = "P1";
      } else if (typeStr.includes("SECURITY") || typeStr.includes("FIGHT")) {
        priority = "P2";
      }

      // Create incident object
      const incident = {
         id: "guest_" + Math.random().toString(36).substring(7),
         type: data.type.toLowerCase(),
         location: data.location,
         status: "pending",
         timestamp: data.timestamp,
         priority: priority,
         source: 'guest',
         isDrill: drillModeActive
      };

      // Add to pending incidents for commander review
      pendingIncidents.push(incident);
      
      // Notify commander of new pending incident
      io.emit("pending_incident", incident);

      // 2. Trigger map highlighting for visual feedback
      io.emit("iot_alert", {
         id: incident.id,
         type: incident.type,
         location: incident.location,
         status: "critical",
         timestamp: incident.timestamp,
         priority: incident.priority,
         isDrill: incident.isDrill
      });
      console.log("Server emitted iot_alert for incident:", incident);

      // 1. Send it immediately to the chat log (but mark as unassigned)
      io.emit("chat_message", {
         id: Math.random().toString(36).substring(7),
         sender: drillModeActive ? "[DRILL] GUEST REPORT" : "GUEST REPORT (PENDING ASSIGNMENT)",
         text: `[${priority}] Guest reported: ${data.type} at ${data.location} - Awaiting commander assignment`,
         type: priority === "P1" ? "alert" : (priority === "P2" ? "system" : "info"),
         timestamp: data.timestamp,
         priority: priority,
         isDrill: drillModeActive
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
