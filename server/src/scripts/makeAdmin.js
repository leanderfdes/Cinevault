require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error("Usage: node src/scripts/makeAdmin.js user@email.com");
      process.exit(1);
    }

    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing in server/.env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      console.error("User not found:", email);
      process.exit(1);
    }

    console.log("Updated:", user.email, "->", user.role);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
