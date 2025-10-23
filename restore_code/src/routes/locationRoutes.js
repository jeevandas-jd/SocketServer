const {addLocation, getAllLocations} = require('../controller/locationController/locationContriller');
const express = require('express');
//const { protect } = require("../middlewares/authMiddleware");
//const { authorizeRoles } = require("../middlewares/roleMiddleware");
const router = express.Router();

// Route to add a new location
//router.post('/locations',authorizeRoles("admin"), addLocation);
// Route to get all locations
router.get('/', getAllLocations);

module.exports = router;