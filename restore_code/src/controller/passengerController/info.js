const User = require("../../models/authentication/User");
const EndUser=require("../../models/authentication/EndUser")

exports.fillInfo = async (req, res) => {
  const { name, department, studentID, gender, contactNo } = req.body;

  if (!name || !department || !studentID || !gender || !contactNo) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already a consumer?
    if (user.__t=== "consumer") {
      return res
        .status(400)
        .json({ message: "Passenger information already exists" });
    }

    // Update fields and set role
    __t: "consumer",        
    user.role = "consumer"; // important!
    user.name = name;
    user.department = department;
    user.studentID = studentID;
    user.gender = gender;
    user.contactNo = contactNo;
    user.FormSubmitted = true;

    const savedPassenger = await user.save();

    return res.status(201).json({
      message: "Passenger info saved successfully",
      passenger: savedPassenger,
    });
  } catch (err) {
    console.error("Error while saving Passenger Info", err);
    return res.status(500).json({ message: "Server error" });
  }
};
