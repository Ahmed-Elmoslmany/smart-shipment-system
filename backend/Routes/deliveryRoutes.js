const express = require("express")
const deliveryOrders = require("../controllers/deliveryController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.patch("/:id", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), deliveryOrders.updateOrderStatus)
router.patch("/:id/assignToMe", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), deliveryOrders.assignOrderToMe)

module.exports = router