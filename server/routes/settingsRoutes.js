const express = require("express");
const router = express.Router();

const Settings = require("../models/Settings");

// Get public website settings.
router.get("/", async (req, res) => {
  try {
    let settings =
      await Settings.findOne();

    // Create default settings if none exist.
    if (!settings) {
      settings =
        await Settings.create({
          productCardsPerRow: 4,
          deliveryCharge: 0,
          announcementText: "",
          announcementSpeed: 20,
          currencyCode: "USD",
          currencySymbol: "$",
        });
    }

    // Safely read the saved ticker speed from MongoDB.
    const savedAnnouncementSpeed =
      Number(
        settings.announcementSpeed
      );

    const announcementSpeed =
      Number.isFinite(
        savedAnnouncementSpeed
      ) &&
      savedAnnouncementSpeed >= 0 &&
      savedAnnouncementSpeed <= 120
        ? savedAnnouncementSpeed
        : 20;

    // Prevent the browser from using an old cached settings response.
    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      success: true,

      settings: {
        productCardsPerRow:
          settings.productCardsPerRow,

        deliveryCharge:
          settings.deliveryCharge,

        announcementText:
          settings.announcementText,

        announcementSpeed,

        currencyCode:
          settings.currencyCode,

        currencySymbol:
          settings.currencySymbol,
      },
    });
  } catch (error) {
    console.error(
      "Failed to load public settings:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load settings.",
    });
  }
});

module.exports = router;