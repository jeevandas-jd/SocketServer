

const Pilot=require("../../models/authentication/PilotUser")


exports.getAllPilots = async (req, res) => {
  try {
    const pilots = await Pilot.find().select("-password");
    res.status(200).json(pilots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPilotById = async (req, res) => {
  try {
    const pilot = await Pilot.findById(req.params.id).select("-password");
    if (!pilot) return res.status(404).json({ message: "Pilot not found" });
    res.status(200).json(pilot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getPilotsNotVerified = async (req, res) => {
  try {
    const pilots = await Pilot.find({ isVerified: false }).select("-password");
    res.status(200).json(pilots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyPilotById = async (req, res) => {
  try {
    const pilot = await Pilot.findById(req.params.id);
    if (!pilot) return res.status(404).json({ message: "Pilot not found" });
    pilot.isApproved = true;
    await pilot.save();
    res.status(200).json({ message: "Pilot verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//get pilots on bench
exports.getPilotsOnBench = async (req, res) => {
  try {
    const pilots = await Pilot.find({ isOnBench: true }).select("-password");
    res.status(200).json(pilots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.acceptOrFreezPilotById = async (req, res) => {
  try {

    const {isOnBench}=req.body
    const pilot = await Pilot.findById(req.params.id);
    if (!pilot) return res.status(404).json({ message: "Pilot not found" });
    pilot.isOnBench = isOnBench;
    await pilot.save();
    res.status(200).json({ message: "Pilot accepted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

