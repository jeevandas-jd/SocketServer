// src/controllers/tripController.js
const TripInfo = require("../../models/tripInfo");
const EndUser = require("../../models/authentication/EndUser");
const Pilot = require("../../models/authentication/PilotUser");
const { offerTripToPilotsSequentially } = require("../../services/tripService");
const axios = require("axios");
exports.createTripRequest = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, fare } = req.body;
    const passengerId = req.user.id;
    console.log("passengerId from request body:", passengerId); 
    const passenger = await EndUser.findById(passengerId);

    if (!passenger) return res.status(404).json({ message: "Passenger not found" });
    console.log("Given infromation:", { pickupLocation, dropLocation, fare });
    const trip = new TripInfo({
      pickupLocation,
      dropLocation,
      passengerId,
      fare,
      status: "requested",
    });


    await trip.save();
    console.log("trip ID", trip.tripId);
    const allPilots = await Pilot.find();
    console.log("all pilots:", allPilots);
    const pilots = await Pilot.find({ isLive: true });
    console.log("Live pilots found:", pilots.length);
    if (!pilots.length)
      return res.status(503).json({ message: "No live pilots available" });

    //const acceptedPilotId = await offerTripToPilotsSequentially(trip, pilots);
    const acceptedPilotId = await axios.post("http://localhost:4000/offer-trip", {
      trip,
      pilots: pilots.map(p => p._id)
    }).then(response => response.data.acceptedPilot)
    .catch(err => {
      console.error("Error offering trip to pilots:", err);
      return null;
    });
    //need to knock all isLive pilots sequentially until one accepts the trip ,how to implement this logic? I guess using sockets
    
    if (!acceptedPilotId) {
      return res.status(503).json({
        message: "Sorry, all pilots are busy or unavailable at the moment.",
      });
    }

    // Update trip
    trip.pilotId = acceptedPilotId;
    trip.status = "accepted";
    trip.acceptedAt = new Date();
    await trip.save();

    return res.status(200).json({ message: "Trip accepted", trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.getTripDetailsPilot = async (req, res) => {
  try {
    const pilotId = req.user.id;
    
    const trips = await TripInfo.find({ pilotId }).populate('passengerId', 'name email');

    if (!trips.length) {
      return res.status(404).json({ message: "No trips found for this pilot" });
    }

    res.status(200).json({ trips });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

exports.getTripDetailsPassenger = async (req, res) => {
  try {
    const passengerId = req.user.id;
    
    const trips = await TripInfo.find({ passengerId }).populate('pilotId', 'name email');

    if (!trips.length) {
      return res.status(404).json({ message: "No trips found for this passenger" });
    }

    res.status(200).json({ trips });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
} 

exports.updateTripStatus = async (req, res) => {
  try {
    const { tripId, status } = req.body;
    const pilotId = req.user.id;
    
    const trip = await TripInfo.findOne({ tripId, pilotId });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found for this pilot" });
    }

    trip.status = status;
    if (status === "completed") {
      trip.completedAt = new Date();
    }
    await trip.save();

    res.status(200).json({ message: "Trip status updated", trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}