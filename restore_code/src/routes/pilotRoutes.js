const {FillPilotInfo} = require("../controller/PilotController/info");
const {UpdatePilotStatus} = require("../controller/PilotController/operations")
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
//const RatePilot= require("../controller/passengerController/postTrip");
//About Trip
const {getTripDetailsPilot,updateTripStatus} = require("../controller/tripController/tripController");
router.post("/fillPilotInfo", protect,authorizeRoles("pilot") ,FillPilotInfo);
router.put("/updatePilotStatus", protect,authorizeRoles("pilot") ,UpdatePilotStatus);
router.get("/getTripDetailsPilot", protect, authorizeRoles("pilot"), getTripDetailsPilot);
router.put("/updateTripStatus", protect, authorizeRoles("pilot"), updateTripStatus);

module.exports = router;