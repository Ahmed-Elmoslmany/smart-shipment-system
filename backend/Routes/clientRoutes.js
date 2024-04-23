const express = require("express")
const clientOrders = require("../controllers/clientController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.post("/createOrder", Auth.protect, Auth.restrictTo("client"), clientOrders.createOrder)

module.exports = router