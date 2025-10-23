// src/socket.js
const { Server } = require("socket.io");
const http = require("http");
const Socket = require("./models/socketModel");
const Pilot = require("./models/authentication/PilotUser")
let io; // will hold io instance
const livePilots = new Map(); // pilotId -> socketId mapping

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Pilot connected:", socket.id);

    socket.on("pilot-online", async ({ pilotId }) => {
      console.log("Pilot online:", pilotId);

      await Socket.deleteMany({ userId: pilotId });
      await Socket.create({ userId: pilotId, socketId: socket.id });
      


     console.log("Socket document saved for pilotId:", pilotId);
    });
    
    socket.on("pilot-offline", async ({ pilotId }) => {
      console.log("Pilot offline:", pilotId);
      livePilots.delete(pilotId);
      await Socket.deleteOne({ userId: pilotId });
    });

    socket.on("disconnect", async () => {
      console.log("Pilot disconnected:", socket.id);
      const record = await Socket.findOne({ socketId: socket.id });
      const pilotId = record ? record.userId.toString() : null;
      console.log("Disconnected pilotId:", pilotId);
      if (pilotId) {

        await Pilot.findByIdAndUpdate(pilotId, { isLive: false });
      await Socket.deleteOne({ socketId: socket.id });
      }

    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

function getLivePilots() {
  return livePilots;
}

module.exports = { initSocket, getIO, getLivePilots };
