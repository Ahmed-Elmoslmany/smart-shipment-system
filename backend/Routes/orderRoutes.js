const express = require("express")
const Order = require("../controllers/orderController")
const clientOrders = require("../controllers/clientController")
const deliveryOrders = require("../controllers/deliveryController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.post("/createOrder", Auth.protect, Auth.restrictTo("client"), clientOrders.createOrder)

router.patch("/:id", Auth.protect, Auth.restrictTo("fixed-delivery", "unorganized-delivery"), deliveryOrders.updateOrderStatus)

module.exports = router