const { getIO } = require("../socket");
const Socket = require("../models/socketModel");

// Define a timeout period (10 seconds)
const TRIP_OFFER_TIMEOUT = 10000; 

async function offerTripToPilotsSequentially(trip, pilots) {
  // 1. Get the global Socket.IO instance
  const io = getIO(); 

  for (const pilot of pilots) {
    // 2. Find the pilot's active socketId from the database
    const socketDoc = await Socket.findOne({ pilotId: pilot._id });
    const socketId =await Socket.findOne({ userId: pilot._id }).then(doc => doc ? doc.socketId : null);
    
    console.log(`Offering trip ${trip.tripId} to pilot ${pilot._id} socket id is ${socketId}`);

    if (!socketId) {
        console.log(`Pilot ${pilot._id} has no active socket entry. Skipping.`);
        continue;
    }

    // CRUCIAL STEP: Retrieve the specific active socket instance
    const pilotSocket = io.sockets.sockets.get(socketId);

    if (!pilotSocket) {
        console.log(`Socket ID ${socketId} found in DB but not active on IO server. Skipping.`);
        // This handles cases where the DB is stale
        continue; 
    }

    const accepted = await new Promise((resolve) => {
      let responded = false;
      
      // 3. Define the handler function
      const handler = (data) => {
        // Data verification: Ensure this response matches the current trip and pilot
        if (
          data.tripId === trip.tripId &&
          data.pilotId === pilot._id.toString() 
        ) {
          console.log(`Received response from pilot ${pilot._id} for trip ${trip.tripId}: ${data.status}`);
          
          // CRUCIAL: Clean up listener and timeout, then resolve
          clearTimeout(timeoutId); 
          pilotSocket.off("pilotResponse", handler);
          responded = true;
          resolve(data.status === "accept");
        }
        // Note: If data doesn't match, the handler does nothing, waiting for the correct response or timeout
      };

      // 4. Attach the listener to the specific pilot's socket
      pilotSocket.on("pilotResponse", handler);
      
      // 5. Send the trip request to the pilot
      pilotSocket.emit("tripRequest", {
        tripId: trip.tripId,
        pickupLocation: trip.pickupLocation,
        dropLocation: trip.dropLocation,
        fare: trip.fare,
      });
      console.log(`Trip request emitted to pilot ${pilot._id} via socket ${socketId}`);

      // 6. Set up the timeout
      const timeoutId = setTimeout(() => {
        if (!responded) {
          console.log(`No response from pilot ${pilot._id} for trip ${trip.tripId} within timeout (${TRIP_OFFER_TIMEOUT / 1000}s)`);
          
          // CRUCIAL: Remove the listener when the request times out
          pilotSocket.off("pilotResponse", handler);
          resolve(false);
        }
      }, TRIP_OFFER_TIMEOUT);
    });

    if (accepted) {
      console.log(`Pilot ${pilot._id} accepted trip ${trip.tripId}`);
      return pilot._id;
    }
  }

  return null;
}

module.exports = { offerTripToPilotsSequentially };
