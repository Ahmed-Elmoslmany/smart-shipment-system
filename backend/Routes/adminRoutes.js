const express = require("express");
const adminController = require("../controllers/adminController");
const Auth = require("../controllers/authController")

const router = express.Router();

router.get("/getAllUsers", Auth.protect, Auth.restrictTo("admin"), adminController.getUsers)
router.patch("/approveDelivery", Auth.protect, Auth.restrictTo("admin"), adminController.approveDelivery)
router.patch("/updateInfo", Auth.protect, Auth.restrictTo("admin"), adminController.updateUserInfo);
router.patch("/banUser", Auth.protect, Auth.restrictTo("admin"), adminController.banUser);
router.get("/getALLDeliveries", Auth.protect, Auth.restrictTo("admin"), adminController.getDeliveries);


module.exports = router;
