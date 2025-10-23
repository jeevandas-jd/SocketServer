

const {getAllUsers,getUserById,removeUserById} = require("../controller/adminController/adminController");
const {getAllPilots,getPilotById,getPilotsNotVerified,verifyPilotById,getPilotsOnBench,acceptOrFreezPilotById}=require("../controller/adminController/pilotContriller")
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const {addLocation, getAllLocations} = require('../controller/locationController/locationContriller');

const router = express.Router();



// Admin routes
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.get("/users/:id", protect, authorizeRoles("admin"), getUserById);
router.delete("/users/:id", protect, authorizeRoles("admin"), removeUserById);

// Pilot routes
router.get("/pilots", protect, authorizeRoles("admin"), getAllPilots);
router.get("/pilots/not-verified", protect, authorizeRoles("admin"), getPilotsNotVerified);
router.get("/pilots/on-bench", protect, authorizeRoles("admin"), getPilotsOnBench);
router.get("/pilots/:id", protect, authorizeRoles("admin"), getPilotById);
router.put("/pilots/verify/:id", protect, authorizeRoles("admin"), verifyPilotById);
router.put("/pilots/accept/:id", protect, authorizeRoles("admin"), acceptOrFreezPilotById);

// Location routes
router.post('/locations', protect, authorizeRoles("admin"), addLocation);
router.get('/locations', protect, authorizeRoles("admin"), getAllLocations);
module.exports = router;