const User = require("../../models/authentication/User");
const Pilot = require("../../models/authentication/PilotUser");

exports.FillPilotInfo = async (req, res) => {
    const { name, department, studentID, gender, vehicleType, vehicleNumber } = req.body;
    //console.log(req.body);
    if (!name || !department || !studentID || !gender || !vehicleType || !vehicleNumber) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // find user by id
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // check if already has pilot discriminator
        if (user.__t === "pilot") {
            return res.status(400).json({ message: "Pilot information already exists" });
        }

        // convert this user into a Pilot (discriminator)
        user.overwrite({
            ...user.toObject(),  // keep existing user fields (email, password, etc.)
            __t: "pilot",        // discriminator key
            name,
            department,
            studentID,
            gender,
            vehicleType,
            vehicleNumber,
            formSubmitted: true,
            isPilot: true
        });
	user.FormSubmitted=true
        const savedPilot = await user.save();
	console.log(savedPilot);
        return res.status(201).json({
            message: "Pilot information saved successfully",
            pilot: savedPilot
        });

    } catch (error) {
        console.error("Error saving pilot information:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


exports.editInfo = async (req, res) => {
    const { name, department, studentID, gender, vehicleType, vehicleNumber } = req.body;

    try {
        // find the logged-in user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ensure this user is a Pilot
        if (user.__t !== "pilot") {
            return res.status(400).json({ message: "User is not a Pilot" });
        }

        // update only the pilot-specific fields
        if (name) user.name = name;
        if (department) user.department = department;
        if (studentID) user.studentID = studentID;
        if (gender) user.gender = gender;
        if (vehicleType) user.vehicleType = vehicleType;
        if (vehicleNumber) user.vehicleNumber = vehicleNumber;

        const updatedPilot = await user.save();

        return res.status(200).json({
            message: "Pilot information updated successfully",
            pilot: updatedPilot
        });

    } catch (error) {
        console.error("Error updating pilot information:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
