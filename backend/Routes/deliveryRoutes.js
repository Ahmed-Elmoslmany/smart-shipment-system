const express = require("express");
const deliveryOrders = require("../controllers/deliveryController");
const Auth = require("../controllers/authController");

const router = express.Router();

router.get("/trips", Auth.protect, Auth.restrictTo("fixed-delivery"), deliveryOrders.getDeliveryTrips);
router.get("/trips/:index", Auth.protect, Auth.restrictTo("fixed-delivery"), deliveryOrders.getTripByIndex);
router.patch("/addTrip", Auth.protect, Auth.restrictTo("fixed-delivery"), deliveryOrders.addDeliveryTrip);
router.patch("/changeTrip/:index", Auth.protect, Auth.restrictTo("fixed-delivery"), deliveryOrders.changeDeliveryTrip);
router.delete("/deleteTrip/:index", Auth.protect, Auth.restrictTo("fixed-delivery"), deliveryOrders.deleteDeliveryTrip);

module.exports = router;