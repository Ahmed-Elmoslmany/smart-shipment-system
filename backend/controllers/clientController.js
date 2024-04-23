const Order = require("../models/Order");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createOrder = catchAsync(async (req, res) => {
  const order = await Order.create({...req.body, client: req.user.id});

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});