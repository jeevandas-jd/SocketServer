const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/authentication/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done,user_role) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // If new, create a user with default role "consumer"
          user = await User.create({
            email: profile.emails[0].value,
            googleId: profile.id,
            role: user_role || "consumer",
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
