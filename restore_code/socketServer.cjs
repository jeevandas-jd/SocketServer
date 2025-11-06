// socketServer.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Socket = require("./src/models/socketModel");
const Pilot = require("./src/models/authentication/PilotUser");
const TripInfo = require("./src/models/tripInfo");
const app = express();
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () =>
  console.log("✅ MongoDB connected to Socket Server")
);

const initIOinstance = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  return io;
};

const io = initIOinstance(server);

/**
 * Helper: schedule fallback to handle pending confirmations.
 * This is a simple in-memory timeout; for production use a persistent job (cron / queue).
 */
function schedulePendingConfirmationCheck(tripId, delayMs = 30000) {
  setTimeout(async () => {
    try {
      const trip = await TripInfo.findOne({ tripId });
      if (!trip) return;
      // If still pending_confirmation after timeout, take fallback action:
      if (trip.status === "pending_confirmation") {
        console.log(`⚠ Trip ${tripId} still pending after ${delayMs}ms. Taking fallback action.`);

        // Example fallback: auto-complete the trip.
        // Uncomment the block below if you want auto-complete behavior.
        /*
        trip.status = "completed";
        trip.clientConfirmation = false; // auto completed without client confirmation
        trip.clientConfirmedAt = null;
        await trip.save();

        // notify pilot about auto completion
        const pilotSocketRec = await Socket.findOne({ userId: trip.pilotId });
        if (pilotSocketRec) {
          io.to(pilotSocketRec.socketId).emit("trip-auto-completed", { tripId, reason: "no_client_confirmation" });
        }
        console.log(`Trip ${tripId} auto-completed due to no client confirmation.`);
        */

        // Or simply flag for manual review:
        // await TripInfo.findOneAndUpdate({ tripId }, { status: "pending_manual_review" });
      }
    } catch (err) {
      console.error("Error in pending confirmation check:", err);
    }
  }, delayMs);
}

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Pilot comes online
  socket.on("pilot-online", async ({ pilotId }) => {
    try {
      console.log("Pilot online:", pilotId);
      await Socket.deleteMany({ userId: pilotId });
      const newSocket = new Socket({ userId: pilotId, socketId: socket.id });
      await newSocket.save();
      console.log("Socket entry created for pilot:", pilotId);
      await Pilot.findByIdAndUpdate(pilotId, { isLive: true });
    } catch (err) {
      console.error("Error in pilot-online:", err);
    }
  });

  socket.on("pilot-offline", async ({ pilotId }) => {
    try {
      console.log("Pilot offline:", pilotId);
      await Socket.deleteOne({ userId: pilotId });
      await Pilot.findByIdAndUpdate(pilotId, { isLive: false });
    } catch (err) {
      console.error("Error in pilot-offline:", err);
    }
  });

  socket.on("disconnect", async () => {
    try {
      console.log("Socket disconnected:", socket.id);
      const record = await Socket.findOne({ socketId: socket.id });
      if (record) {
        await Pilot.findByIdAndUpdate(record.userId, { isLive: false });
        await Socket.deleteOne({ socketId: socket.id });
      }
    } catch (err) {
      console.error("Error on disconnect:", err);
    }
  });

  // Client (passenger) registers their socket
  socket.on("client-request", async ({ userId }) => {
    try {
      console.log("client-request from user:", userId, "socket:", socket.id);
      const existingSocket = await Socket.findOne({ userId });
      if (existingSocket) {
        console.log("Socket already exists for user:", userId, "removing old entry");
        await Socket.deleteOne({ userId });
      }
      const newSocket = new Socket({ userId, socketId: socket.id });
      await newSocket.save();
      console.log("Socket entry created for user:", userId);
    } catch (err) {
      console.error("Error in client-request:", err);
    }
  });

  /**
   * Pilot or system sends trip-status updates.
   * If pilot reports status === "completed", we ask the passenger to confirm before finalizing.
   */
  socket.on("trip-status", async ({ tripId, status, pilotId }) => {
    try {
      console.log(`Trip ${tripId} status update:`, status);

      // find the trip
      const trip = await TripInfo.findOne({ tripId });
      if (!trip) {
        console.warn("Trip not found:", tripId);
        return;
      }

      // Handle completed: ask client to confirm
      if (status === "completed" || status === "ended") {
        // mark pilot confirmation & pending confirmation state
        //trip.status = "pending_confirmation";
        //trip.pilotConfirmedAt = new Date();
        //trip.endedAt = new Date();
        if (pilotId) trip.pilotId = pilotId;
        await trip.save();

        // find client socket
        const clientId = trip.passengerId;
        const clientSocketRec = await Socket.findOne({ userId: clientId });

        if (clientSocketRec) {
          const clientSocketId = clientSocketRec.socketId;
          console.log(`Asking client ${clientId} (socket ${clientSocketId}) to confirm trip ${tripId}`);

          // Use Socket.IO timeout to wait for client's ACK (callback)
          // timeout set to 30s (30000 ms)
          io.to(clientSocketId)
            .timeout(30000)
            .emit("confirm-trip-end", { tripId, message: "Pilot marked trip as ended. Please confirm." }, async (err, ack) => {
              if (err) {
                // No ack from client within timeout
                console.warn(`No ack from client ${clientId} for trip ${tripId} within timeout.`);
                // schedule fallback check (or take direct action here)
                schedulePendingConfirmationCheck(tripId, 0); // run fallback immediately (or set desired delay)
                return;
              }

              // ack received from client as callback parameter
              // ack may contain { confirmed: true } or whatever client sends
              try {
                const confirmed = ack && ack.confirmed;
                if (confirmed) {
                  // trip.clientConfirmation = true;
                  // trip.clientConfirmedAt = new Date();
                  trip.status = "completed";
                  await trip.save();

                  console.log(`✅ Client ${clientId} acknowledged and trip ${tripId} marked completed.`);

                  // notify pilot
                  if (trip.pilotId) {
                    const pilotSocketRec = await Socket.findOne({ userId: trip.pilotId });
                    if (pilotSocketRec) {
                      io.to(pilotSocketRec.socketId).emit("trip-completed-by-client", { tripId });
                    }
                  }
                } else {
                  // Client explicitly rejected confirmation
                  trip.clientConfirmation = false;
                  trip.clientConfirmedAt = null;
                  trip.status = "in_progress"; // or "client_rejected_completion"
                  await trip.save();

                  console.log(`❌ Client ${clientId} reported trip ${tripId} not finished (rejected pilot completion).`);

                  // notify pilot
                  if (trip.pilotId) {
                    const pilotSocketRec = await Socket.findOne({ userId: trip.pilotId });
                    if (pilotSocketRec) {
                      io.to(pilotSocketRec.socketId).emit("client-rejected-completion", { tripId });
                    }
                  }
                }
              } catch (err2) {
                console.error("Error handling client ack callback:", err2);
              }
            });
        } else {
          // client offline — set pending and schedule fallback
          console.log(`No socket found for client ${clientId}. Trip ${tripId} pending confirmation.`);
          // Save a pendingConfirmUntil timestamp if desired
          trip.pendingConfirmUntil = new Date(Date.now() + 30 * 1000); // example 30s
          await trip.save();
          schedulePendingConfirmationCheck(tripId, 30000);
        }
      } else {
        // other statuses: update directly and notify passenger if needed
        trip.status = status;
        await trip.save();

        // notify passenger if online
        const clientSocketRec = await Socket.findOne({ userId: trip.passengerId });
        if (clientSocketRec) {
          io.to(clientSocketRec.socketId).emit("trip-status-update", { tripId, status });
          console.log(`Emitted trip status update to client ${trip.passengerId} for trip ${tripId}`);
        } else {
          console.log(`No socket found for client ${trip.passengerId}`);
        }
      }
    } catch (err) {
      console.error("Error in trip-status handler:", err);
    }
  });

  /**
   * Client explicit confirmation event (alternative/backup to callback-based ack)
   * Client can emit this event when they confirm from UI.
   */
  socket.on("client-trip-end-confirmation", async ({ tripId, confirmed, userId }) => {
    try {
      console.log(`client-trip-end-confirmation received: trip ${tripId}, confirmed: ${confirmed}, from user ${userId}`);
      const trip = await TripInfo.findOne({ tripId });
      if (!trip) {
        console.warn("Trip not found on client confirmation:", tripId);
        return;
      }

      trip.clientConfirmation = !!confirmed;
      trip.clientConfirmedAt = confirmed ? new Date() : null;

      if (confirmed) {
        trip.status = "completed";
        await trip.save();

        // notify pilot
        if (trip.pilotId) {
          const pilotSocketRec = await Socket.findOne({ userId: trip.pilotId });
          if (pilotSocketRec) {
            io.to(pilotSocketRec.socketId).emit("trip-completed-by-client", { tripId });
          }
        }
        console.log(`✅ Trip ${tripId} completed following client confirmation.`);
      } else {
        // client said trip not ended; reopen or keep ongoing
        trip.status = "ongoing"; // or a custom state you prefer
        await trip.save();

        if (trip.pilotId) {
          const pilotSocketRec = await Socket.findOne({ userId: trip.pilotId });
          if (pilotSocketRec) {
            io.to(pilotSocketRec.socketId).emit("client-rejected-completion", { tripId });
          }
        }

        console.log(`❌ Client rejected completion for trip ${tripId}. Trip reverted to ongoing.`);
      }
    } catch (err) {
      console.error("Error handling client-trip-end-confirmation:", err);
    }
  });
}); // end io.on("connection")

// --- HTTP endpoint for Lambda communication ---
app.use(express.json());

app.post("/offer-trip", async (req, res) => {
  try {
    const { trip, pilots } = req.body;
    console.log(`Received trip offer request for trip ${trip.tripId} to pilots:`, pilots);
    const { offerTripToPilotsSequentially } = require("./src/services/tripService");
    const pilotId = await offerTripToPilotsSequentially(trip, pilots, io);
    console.log(`Trip ${trip.tripId} accepted by pilot:`, pilotId);
    res.json({ acceptedPilot: pilotId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.SOCKET_PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Socket.IO server running on ${PORT}`));
