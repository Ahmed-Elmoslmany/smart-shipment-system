const express = require("express")
const clientOrders = require("../controllers/clientController")
const Auth = require("../controllers/authController")

const router = express.Router()

router.get("/nearestDelivery", Auth.protect, Auth.restrictTo("client"), clientOrders.nearestDelivery)
router.post("/createOrder", Auth.protect, Auth.restrictTo("client"), clientOrders.createOrder)
router.get("/getAllOrders", Auth.protect, Auth.restrictTo("client"), clientOrders.getAllOrders);

router.patch('/:id/success', Auth.protect, Auth.restrictTo("client"), clientOrders.success);
router.patch('/:id/cancel', Auth.protect, Auth.restrictTo("client"), clientOrders.cancel);
router.post('/:id/checkout', Auth.protect, Auth.restrictTo("client"), clientOrders.checkout);

//some get,update,delete routes !
router
.route("/:id")
.get(Auth.protect, Auth.restrictTo("client"), clientOrders.getOrder)
.patch(Auth.protect, Auth.restrictTo("client"), clientOrders.updateOrder)
.delete(Auth.protect, Auth.restrictTo("client"), clientOrders.deleteOrder);

module.exports = router