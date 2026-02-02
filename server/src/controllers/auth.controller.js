const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function register(req, res) {
  const { email, password } = req.validated.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, role: "user" });

  return res.status(201).json({
    token: signToken(user),
    user: { id: user._id, email: user.email, role: user.role }
  });
}

async function login(req, res) {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({
    token: signToken(user),
    user: { id: user._id, email: user.email, role: user.role }
  });
}

module.exports = { register, login };
