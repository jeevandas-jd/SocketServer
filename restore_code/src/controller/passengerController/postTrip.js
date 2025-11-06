// controllers/passengerController/postTrip.js
const Pilot = require('../../models/authentication/PilotUser');

exports.RatePilot = async (req, res) => {
  try {
    const { pilotId, rating } = req.body;
    const passengerId = req.user?.id;

    if (!pilotId) return res.status(400).json({ message: "pilotId is required" });
    if (rating == null) return res.status(400).json({ message: "rating is required" });
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "rating must be a number between 1 and 5" });
    }

    // Support either the custom pilotId string (PILOTxxxx) or the Mongo _id
    const pilot = await Pilot.findOne({
      $or: [{ pilotId: pilotId }, { _id: pilotId }]
    });

    if (!pilot) {
      return res.status(404).json({ message: "Pilot not found" });
    }

    // Safe defaults
    const prevTotal = Number(pilot.totalRatings || 0);
    const prevAvg = Number(pilot.ratingAverage || 0);

    // Correct weighted average calculation:
    // newAverage = (prevAvg * prevTotal + newRating) / (prevTotal + 1)
    const newTotal = prevTotal + 1;
    const newAverage = (prevAvg * prevTotal + numericRating) / newTotal;

    pilot.ratingAverage = newAverage;
    pilot.totalRatings = newTotal;

    await pilot.save();

    return res.status(200).json({ message: "Pilot rated successfully", pilot });
  } catch (error) {
    console.error("RatePilot error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
