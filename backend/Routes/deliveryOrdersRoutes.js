const express = require("express")
const deliveryOrders = require("../controllers/deliveryController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.get("/summary", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), deliveryOrders.summary)

router.patch("/:id", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), deliveryOrders.updateOrderStatus)
router.patch("/:id/assignToMe", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery","client"), deliveryOrders.assignOrderToMe)

module.exports = router