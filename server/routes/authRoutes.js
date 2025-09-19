const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../models/userModel");

const router = express.Router();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Register User
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });
        res.json({
            token,
            message: "User login successful!"
        });

        console.log("User login successful");

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Generate a reset token and hash it
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(resetToken, 10);

        // Set token and expiry on user record
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `http://localhost:3000/resetpassword.html?token=${resetToken}&email=${email}`;
        await transporter.sendMail({
            to: email,
            subject: "Password Reset",
            html: `<p>You requested a password reset</p>
                   <p>Click this <a href="${resetUrl}">link</a> to reset your password</p>`,
        });

        res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
        console.error("Error in forgot-password route:", error);
        res.status(500).json({ message: "Error sending password reset email" });
    }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Verify that the token is still valid
        if (!user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Check if token is expired
        if (Date.now() > user.resetPasswordExpires) {
            return res.status(400).json({ message: "Token has expired" });
        }

        // Validate token
        const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isTokenValid) {
            return res.status(400).json({ message: "Invalid token" });
        }

        // Update password and clear reset token
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Error in reset-password route:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
});

module.exports = router;
