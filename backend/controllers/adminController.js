const User = require("../models/User");
const Order = require("../models/Order");
const APIFeatures = require("../utils/APIFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order.find(), req.query)
    .filter()
    .limitFields()
    .paginate();


    const orders = await features.query;
    
  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.getDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await User.find({
    role: { $in: ["fixed-delivery", "unorganized-delivery"] },
  });
  res.status(200).json({
    status: "success",
    results: deliveries.length,
    data: {
      deliveries,
    },
  });
});

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ role: "client" });
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.approveDelivery = catchAsync(async (req, res, next) => {
  const delivery = await User.findOne({ _id: req.body.deliveryId });
  if (!delivery) {
    return next(
      new AppError("Delivery not found", 404, "delivery", "Not found")
    );
  }
  delivery.deliveryApproved = true;
  await delivery.save();
  res.status(200).json({
    status: "success",
    data: {
      delivery,
    },
  });
});
4;
exports.updateUserInfo = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate({ _id: req.body.userId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError("User not found", 404, "user", "Not found"));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.banUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { _id: req.body.userId },
    { active: false },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!user) {
    return next(new AppError("User not found", 404, "user", "Not found"));
  }
  res.status(200).json({
    status: "success",
    message: "User banned successfully",
    data: {
      user,
    },
  });
});
