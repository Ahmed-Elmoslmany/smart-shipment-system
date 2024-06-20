const Order = require("../models/Order");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const filterObj = require("../utils/filterObj");

exports.createOrder = catchAsync(async (req, res, next) => {
  const order = await Order.create({ ...req.body, client: req.user.id });

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.nearestDelivery = catchAsync(async (req, res, next) => {
  const [lng, lat] = req.query.startLocation.split(",");
  const endLocation = req.query.endLocation;
  const maxDis = req.query.maxDis;

  const delivery = await User.find({
    "trip.startLoc": {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxDis * 1,
      },
    },
  });

  if (!delivery)
    return next(
      new AppError(
        "There is no delivery near to you, We will notify if they there",
        400,
        "Delivery",
        "Can't found"
      )
    );

  const availableDelivery = delivery.filter((user) =>
    user.trip.some((trip) => trip.endState === endLocation)
  );
  
  if (!availableDelivery)
    return next(
      new AppError(
        `There is no delivery can going to ${endLocation}, We will notify if they there`,
        400,
        "Delivery",
        "Can't found"
      )
    );
  // console.log(delivery);

  res.status(200).json({
    status: "success",
    results: availableDelivery.length,
    data: {
      deliveries: availableDelivery,
    },
  });
});

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
  const order = await Order.findOne({
    _id: req.params.id,
    client: req.user.id,
  });

  if (!order) {
    return next(
      new AppError("Order not found with this ID", 404, "ID", "Can't found")
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "type", "description");

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, client: req.user.id },
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    return next(new AppError("No order found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findOneAndDelete({
    _id: req.params.id,
    client: req.user.id,
  });

  if (!order) {
    return next(
      new AppError("Order not found with this ID", 404, "ID", "Can't found")
    );
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
