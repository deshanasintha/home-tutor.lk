const express = require("express");
const { auth, db } = require("../config/firebase");

const router = express.Router();
const bookingFields = [
    "parentName",
    "tutorId",
    "tutorName",
    "subject",
    "grade",
    "preferredDate",
    "preferredTime",
    "location",
];

router.post("/bookings", async (req, res) => {
    const authorization = req.get("Authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);

    if (!tokenMatch) {
        return res.status(401).json({ success: false, error: "Authentication required." });
    }

    let decodedToken;
    try {
        decodedToken = await auth.verifyIdToken(tokenMatch[1]);
    } catch (error) {
        console.warn("Booking request rejected due to invalid Firebase ID token.");
        return res.status(401).json({ success: false, error: "Invalid or expired authentication token." });
    }

    const {
        parentId,
        parentName,
        tutorId,
        tutorName,
        subject,
        grade,
        preferredDate,
        preferredTime,
        location,
        message = "",
    } = req.body || {};

    if (parentId !== decodedToken.uid) {
        return res.status(403).json({ success: false, error: "Parent ID does not match the authenticated user." });
    }

    const booking = {
        parentId: decodedToken.uid,
        parentName,
        tutorId,
        tutorName,
        subject,
        grade,
        preferredDate,
        preferredTime,
        location,
        message,
    };

    const missingFields = bookingFields.filter(
        (field) =>
            typeof booking[field] !== "string" ||
            booking[field].trim().length === 0,
    );

    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Required fields are missing or invalid: ${missingFields.join(", ")}.`,
        });
    }

    if (typeof message !== "string") {
        return res.status(400).json({ success: false, error: "Message must be a string." });
    }

    try {
        const bookingRef = await db.collection("bookings").add({
            ...booking,
            status: "pending",
            createdAt: new Date(),
        });

        return res.status(201).json({ success: true, bookingId: bookingRef.id });
    } catch (error) {
        console.error("Failed to save booking request:", error);
        return res.status(500).json({ success: false, error: "Unable to save booking request." });
    }
});

module.exports = router;
