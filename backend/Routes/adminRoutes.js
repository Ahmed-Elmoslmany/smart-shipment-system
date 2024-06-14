const express = require("express");
const adminController = require("../controllers/adminController");
const Auth = require("../controllers/authController")

const router = express.Router();

router.patch("/approveDelivery", Auth.protect, Auth.restrictTo("admin"), adminController.approveDelivery)
router.patch("/updateInfo", Auth.protect, Auth.restrictTo("admin"), adminController.updateUserInfo);
router.get("/getDeliveries", Auth.protect, Auth.restrictTo("admin"), adminController.getDeliveries);

module.exports = router;
