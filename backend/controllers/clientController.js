const Order = require("../models/Order");
const User = require("../models/User")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const geocodeAddress = require("../utils/geocodeAddress");
const calculateDistance = require("../utils/distanceUtils");

exports.createOrder = catchAsync(async (req, res, next) => {
  // Geocode the end location address
  let endCoordinates;
  try {
    endCoordinates = await geocodeAddress(req.body.endLocation);
  } catch (error) {
    return next(new AppError("Invalid end location address", 400, "endLocation", "Invalid"));
  }

  // Create the order with geocoded endLoc
  const orderData = {
    ...req.body,
    client: req.user.id,
    endLocation: "cairo",
    endLoc: {
      type: "Point",
      coordinates: endCoordinates
    },
    startLoc: {
      type: "Point",
      coordinates: req.body.startLoc.coordinates
    },
    currentLoc: {
      type: "Point",
      coordinates: req.body.currentLoc.coordinates
    }
  };

  const order = await Order.create(orderData);

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

  // Convert endLocation text address to coordinates
  let endCoordinates;
  try {
    endCoordinates = await geocodeAddress(endLocation);
  } catch (error) {
    return next(new AppError("Invalid end location address", 400));
  }

  const delivery = await User.find({
    startLoc: {
      $near: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $minDistance: 1,
        $maxDistance: maxDis * 1,
      },
    },
  });

  if (!delivery.length) {
    return next(new AppError("There is no delivery near to you, We will notify if they are there", 400));
  }

  // Filter deliveries based on endState matching the endLocation text
  const availableDelivery = delivery.filter(delivery => {
    if (!delivery.endLoc || !delivery.endLoc.coordinates) {
      return false; // Skip deliveries without valid endLoc coordinates
    }
    
    const [deliveryLng, deliveryLat] = delivery.endLoc.coordinates;
    const distance = calculateDistance(endCoordinates[1], endCoordinates[0], deliveryLat, deliveryLng);
    return distance <= maxDis;
  });

  if (!availableDelivery.length) {
    return next(new AppError(`There is no delivery going to ${endLocation}, We will notify if they are there`, 400));
  }

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
  const order = await Order.findOne({ _id: req.params.id, client: req.user.id });

  if (!order) {
    return next(new AppError("Order not found with this ID", 404, "ID", "Can't found"));
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
    return next(new AppError("Order not found with this ID", 404, "ID", "Can't found"));
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
    return next(new AppError("Order not found with this ID", 404, "ID", "Can't found"));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

