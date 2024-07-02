const Order = require("../models/Order");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");

const ordersSummary = (orders) => {
  return orders.map((order) => ({
    client: order.client.name,
    type: order.type,
    price: order.price,
    description: order.description,
    status: order.status,
    weight: order.weight,
    quantity: order.quantity,
  }));
};

exports.getAvailableOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ delivery: { $exists: false } }),
    req.query
  )
    .filter()
    .limitFields()
    .paginate();

  const orders = await features.query.populate("client");
  const processedOrders = ordersSummary(orders);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: { orders: processedOrders },
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const status = req.query.status;

  if (!id) {
    return next(new AppError('Order ID is required', 400, 'id', 'Validation'));
  }
  
  if (!status) {
    return next(new AppError('Order status is required', 400, 'status', 'Validation'));
  }

  try {
    let update;
    switch (status) {
      case "picked-up":
        update = { status: "picked-up", pickedUp: true, unPicked: false };
        break;

      case "coming":
        update = { status: "coming", coming: true, pickedUp: false };
        break;

      case "delivered":
        update = { status: "delivered", delivered: true, coming: false };
        break;

      default:
        return next(
          new AppError(`Invalid order status: ${status}`, 400, 'status', 'Validation')
        );
    }
    
    await Order.findByIdAndUpdate(id, update, { new: true, runValidators: true });

    res.status(200).json({
      status: "success",
      message: "Order status updated successfully",
    });
  } catch (error) {
    return next(
      new AppError('Unable to update order status, please try again later', 500, 'database', 'Database')
    );
  }
});


exports.assignOrderToMe = catchAsync(async (req, res, next) => {
  const deliveryUserId = req.query.delivery;

  if (!deliveryUserId) {
    return next(new AppError("Please provide a delivery user ID.", 400));
  }

  // Fetch the delivery user details
  const deliveryUser = await User.findById(deliveryUserId);

  if (!deliveryUser) {
    return next(new AppError("Delivery user not found.", 404));
  }

  // Update the order with the delivery user ID
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { delivery: deliveryUserId },
    { new: true }
  );

  if (!order) {
    return next(new AppError("Order not found.", 404));
  }

  res.status(200).json({
    status: "success",
    message: `Order assigned to ${deliveryUser.name} successfully, please deliver it as soon as possible!`,
  });
});


exports.summary = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ delivery: req.user.id }),
    req.query
  )
    .filter()
    .limitFields()
    .paginate();

  const orders = await features.query;

  const processedOrders = orders.map(order => ({
    _id: order._id,
    client: order.client.name || order.client,
    type: order.type,
    description: order.description,
    status: order.status,
    weight: order.weight,
    quantity: order.quantity
  }));

  if (processedOrders.length > 0) {
    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders: processedOrders,
      },
    });
  } else {
    res.status(200).json({
      status: "success",
      message: "There are no orders found",
    });
  }
});



exports.addDeliveryTrip = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'id', 'Validation'));
  }

  user.trip = [...user.trip, ...req.body.trip];

  await user.save();
  
  res.status(200).json({
    status: "success",
    message: "Trip added successfully",
  });
});

exports.deleteDeliveryTrip = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  const indexToDelete = req.params.index;
  
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'id', 'Validation'));
  }

  if (indexToDelete > -1 && indexToDelete < user.trip.length) {
    user.trip.splice(indexToDelete, 1);
  }
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Trip deleted successfully",
  });
});

exports.changeDeliveryTrip = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  const indexToChange = req.params.index;
  
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'id', 'Validation'));
  }

  if (indexToChange > -1 && indexToChange < user.trip.length) {
    user.trip[indexToChange] = { ...user.trip[indexToChange], ...req.body};
  }

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Trip changed successfully",
  });
});

exports.getDeliveryTrips = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'id', 'Validation'));
  }

  res.status(200).json({
    status: "success",
    data: {
      trips: user.trip,
    },
  });
});

exports.getTripByIndex = catchAsync(async (req, res, next) => {
  const id = req.user.id;
  const index = parseInt(req.params.index, 10);

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'id', 'Validation'));
  }

  if (index < 0 || index >= user.trip.length) {
    return next(new AppError('Trip not found', 404, 'index', 'Validation'));
  }

  res.status(200).json({
    status: "success",
    data: {
      trip: user.trip[index],
    },
  });
});