const express = require("express");
const passport = require("passport");
const authController = require("../controller/authentication/auth");
const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// -------- MANUAL AUTH --------
router.post("/register", authController.register);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// -------- GOOGLE OAUTH --------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  authController.googleAuthCallback
);

// -------- PROTECTED EXAMPLES --------
router.get("/profile", protect, (req, res) => {
  res.json({ message: `Hello, user ${req.user.id}`, role: req.user.role });
});

// example: only admin can onboard pilots
router.post(
  "/onboard-pilot/:id",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Admin approves pilot
      const pilot = await User.findByIdAndUpdate(
        req.params.id,
        { isApproved: true },
        { new: true }
      );
      res.json({ message: "Pilot approved", pilot });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
