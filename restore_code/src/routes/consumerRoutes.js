const {fillInfo}=require("../controller/passengerController/info")
const {createTripRequest}=require("../controller/tripController/tripController")
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const {RatePilot}= require("../controller/passengerController/postTrip");
//About Trip
const {getTripDetailsPassenger}=require("../controller/tripController/tripController");
router.get("/getTripDetailsPassenger", protect, authorizeRoles("consumer"), getTripDetailsPassenger);
router.post("/fillInfo", protect,authorizeRoles("consumer") ,fillInfo);
router.post("/tripRequest", protect,authorizeRoles("consumer") ,createTripRequest);
router.post("/ratePilot", protect, authorizeRoles("consumer"), RatePilot);
module.exports = router;