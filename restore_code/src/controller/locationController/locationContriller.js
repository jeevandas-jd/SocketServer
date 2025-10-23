const Location = require('../../models/locations');

// Add a new location
exports.addLocation = async (req, res) => {
    try {
        const { department } = req.body;
        const newLocation = new Location({ department });
        await newLocation.save();
        res.status(201).json(newLocation);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all locations
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.find();
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};