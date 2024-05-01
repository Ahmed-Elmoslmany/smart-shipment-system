const express = require("express")
const clientOrders = require("../controllers/clientController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.post("/createOrder", Auth.protect, Auth.restrictTo("client"), clientOrders.createOrder)
router.get("/orders", Auth.protect, Auth.restrictTo("client"), clientOrders.getAllOrders);

router
.route("/orders/:id")
.get(Auth.protect, Auth.restrictTo("client"), clientOrders.getOrder)
.patch(Auth.protect, Auth.restrictTo("client"), clientOrders.updateOrder)
.delete(Auth.protect, Auth.restrictTo("client"), clientOrders.deleteOrder);

module.exports = router