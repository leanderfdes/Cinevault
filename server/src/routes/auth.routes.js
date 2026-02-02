const express = require("express");
const { z } = require("zod");
const { validate } = require("../utils/validate");
const { register, login } = require("../controllers/auth.controller");

const router = express.Router();

const authSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 chars")
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

router.post("/register", validate(authSchema), register);
router.post("/login", validate(authSchema), login);

module.exports = router;
