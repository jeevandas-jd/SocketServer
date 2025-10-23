// socketServer.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Socket = require("./src/models/socketModel");
const Pilot = require("./src/models/authentication/PilotUser");

const app = express();
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () =>
  console.log("✅ MongoDB connected to Socket Server")
);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🟢 Pilot connected:", socket.id);

  socket.on("pilot-online", async ({ pilotId }) => {
    console.log("Pilot online:", pilotId);
    await Socket.deleteMany({ userId: pilotId });
    await Socket.create({ userId: pilotId, socketId: socket.id });
    await Pilot.findByIdAndUpdate(pilotId, { isLive: true });
  });

  socket.on("pilot-offline", async ({ pilotId }) => {
    console.log("Pilot offline:", pilotId);
    await Socket.deleteOne({ userId: pilotId });
    await Pilot.findByIdAndUpdate(pilotId, { isLive: false });
  });

  socket.on("disconnect", async () => {
    console.log("Pilot disconnected:", socket.id);
    const record = await Socket.findOne({ socketId: socket.id });
    if (record) {
      await Pilot.findByIdAndUpdate(record.userId, { isLive: false });
      await Socket.deleteOne({ socketId: socket.id });
    }
  });
});

// --- HTTP endpoint for Lambda communication ---
app.use(express.json());

app.post("/offer-trip", async (req, res) => {
  try {
    const { trip, pilots } = req.body;
    const { offerTripToPilotsSequentially } = require("./src/services/tripService");
    const pilotId = await offerTripToPilotsSequentially(trip, pilots);
    res.json({ acceptedPilot: pilotId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.SOCKET_PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Socket.IO server running on ${PORT}`));
