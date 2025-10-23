const {fillInfo}=require("../controller/passengerController/info")
const {createTripRequest}=require("../controller/tripController/tripController")
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

//About Trip
const {getTripDetailsPassenger}=require("../controller/tripController/tripController");
router.get("/getTripDetailsPassenger", protect, authorizeRoles("consumer"), getTripDetailsPassenger);
router.post("/fillInfo", protect,authorizeRoles("consumer") ,fillInfo);
router.post("/tripRequest", protect,authorizeRoles("consumer") ,createTripRequest);

module.exports = router;