const express = require("express")
const Order = require("../controllers/orderController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.post("/createOrder", Auth.protect, Auth.restrictTo("client"), Order.createOrder)

router.patch("/:id", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), Order.updateOrderStatus)

module.exports = router