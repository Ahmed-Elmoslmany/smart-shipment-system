const Order = require("../models/Order");
const User = require("../models/User")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");

exports.createOrder = catchAsync(async (req, res,next) => {
  const order = await Order.create({...req.body, client: req.user.id});

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.nearestDelivery = catchAsync(async (req, res, next) => {
  const [lng, lat] = req.query.startLocation.split(",")
  const endLocation = req.query.endLocation
  const maxDis = req.query.maxDis
  // console.log(endLocation);
  const delivery = await User.find({
    startLoc: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $minDistance: 1,
        $maxDistance: maxDis * 1
      }
    }
  })
  

  if(!delivery) return next(new AppError("There is no delivery near to you, We will notify if they there", 400))
  

  availableDelivery = delivery.filter( delivery => delivery.endState === endLocation)

  if(!availableDelivery) return next(new AppError(`There is no delivery can going to ${endLocation}, We will notify if they there`, 400))

  res.status(200).json({
    status: "success",
    results: availableDelivery.length,
    data: {
      deliveries: availableDelivery,
    },
  });
  // console.log(delivery);
})

exports.getAllOrders = catchAsync(async (req, res, next) => {
  let query = Order.find({ client: req.user.id });
  const features = new APIFeatures(query, req.query)
  .filter()
  .sort()
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

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, client: req.user.id });

  if (!order) {
    return next(new AppError("Order not found with this ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, client: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    return next(new AppError("Order not found with this ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOneAndDelete({ _id: req.params.id, client: req.user.id });

  if (!order) {
    return next(new AppError("Order not found with this ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

