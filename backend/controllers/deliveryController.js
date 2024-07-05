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
  let deliveryUserIds = req.query.delivery;

  if (!deliveryUserIds) {
    return next(new AppError("Please provide delivery user IDs.", 400));
  }

  if (!Array.isArray(deliveryUserIds)) {
    deliveryUserIds = [deliveryUserIds];
  }

  // Check if any of the delivery user IDs belong to clients
  const clientUsers = await User.find({ _id: { $in: deliveryUserIds }, role: 'client' });
  if (clientUsers.length > 0) {
    const clientNames = clientUsers.map(user => user.name).join(', ');
    return next(new AppError(`Cannot assign order to client(s): ${clientNames}.`, 400));
  }

  const deliveryUsers = await User.find({ _id: { $in: deliveryUserIds } });

  if (deliveryUsers.length !== deliveryUserIds.length) {
    return next(new AppError("One or more delivery users not found.", 404));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found.", 404));
  }

  // Check if any of the delivery users are already assigned to the order
  const alreadyAssignedUsers = deliveryUsers.filter(user => order.delivery.includes(user._id));

  if (alreadyAssignedUsers.length > 0) {
    const duplicateNames = alreadyAssignedUsers.map(user => user.name).join(', ');
    return next(new AppError(`Order is already assigned to ${duplicateNames}.`, 400));
  }

  // Add delivery user IDs to the order if they are not already present
  deliveryUserIds.forEach(deliveryUserId => {
    if (!order.delivery.includes(deliveryUserId)) {
      order.delivery.push(deliveryUserId);
    }
  });

  await order.save();

  res.status(200).json({
    status: "success",
    message: `Order assigned to ${deliveryUsers.map(user => user.name).join(', ')} successfully, please deliver it as soon as possible!`,
  });
});









exports.summary = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ delivery: req.user.id }).populate('delivery', 'name phone'), // Populate delivery with name and phone
    req.query
  )
    .filter()
    .limitFields()
    .paginate();

  const orders = await features.query;

  const processedOrders = orders.map(order => {
    // Filter out the current deliveryman from the delivery array
    const otherDeliverymen = order.delivery.filter(deliveryman => deliveryman.id !== req.user.id);

    return {
      _id: order._id,
      recipentName: order.recipentName,
      reciepentPhone: order.reciepentPhone,
      type: order.type,
      description: order.description,
      status: order.status,
      weight: order.weight,
      quantity: order.quantity,
      createdAt: order.createdAt,
      otherDeliverymen: otherDeliverymen.map(deliveryman => ({
        name: deliveryman.name,
        phone: deliveryman.phone
      }))
    };
  });

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

