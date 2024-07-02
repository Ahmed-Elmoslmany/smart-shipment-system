const Order = require("../models/Order");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const filterObj = require("../utils/filterObj");
const calculateDistance = require("../utils/distanceUtils");

exports.createOrder = catchAsync(async (req, res, next) => {
  const [lng1, lat1] = req.body.startLoc.coordinates;
  const [lng2, lat2] = req.body.endLoc.coordinates;
  const dis = calculateDistance(lat1, lng1, lat2, lng2) / 1000;


  const priceInPiasters = dis < 20 ? 2000 : Math.ceil(dis * 0.5 * 100);
  const priceCeiled = Math.ceil(priceInPiasters / 100) * 100; 

  let order = await Order.create({
    ...req.body,
    client: req.user.id,
    price: priceCeiled 
  });

  res.status(201).json({
    status: "success",
    data: {
      order: {
        ...order.toObject(),
        price: (order.price / 100).toFixed(2) 
      },
    },
  });
});



exports.nearestDelivery = catchAsync(async (req, res, next) => {
  const [lng, lat] = req.query.startLocation.split(",");
  const endState = req.query.endState;
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
  // console.log(delivery);
  const availableDelivery = delivery.filter((user) =>
    user.trip.some((trip) => trip.endState === endState)
  );

  if (!availableDelivery)
    return next(
      new AppError(
        `There is no delivery can going to ${endState}, We will notify if they there`,
        400,
        "Delivery",
        "Can't found"
      )
    );

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

exports.checkout = catchAsync(async (req, res, next) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const order_id = req.params.id;
  const order = await Order.findById(order_id);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "EGP",
          product_data: {
            name: `Order type: ${order.type}\nOrder ID: ${order._id}`,
          },
          unit_amount: order.price, // Use the price in piasters as stored in the order
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://smart-shipment-system.vercel.com/${order.id}/success`,
    cancel_url: `https://smart-shipment-system.vercel.com/${order.id}/cancel`,
  });

  res.status(200).json({
    status: "success",
    data: {
      id: session.id,
      url: session.url,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
      total_amount: Math.ceil(session.amount_total / 100), // Convert back to EGP and ceil to the nearest whole number
      total_details: session.total_details,
    },
  });
});




exports.success = catchAsync(async (req, res, next) => {
  const order_id = req.params.id;

  const order = await Order.findById(order_id);

  order.status = "delivered";
  order.paidStatus = "paid";

  order.unPicked = false;
  order.pickedUp = false;
  order.coming = false;
  order.delivered = true;

  order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.cancel = catchAsync(async (req, res, next) => {
  const order_id = req.params.id;

  const order = await Order.findById(order_id);

  order.paidStatus = "cancelled";

  order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

const findDeliveryChain = async (orderStartState, orderEndState) => {
  const deliveries = await User.find({ role: "fixed-delivery" }).select("trip name phone vehicleType profileImage");

  if (deliveries.length === 0) {
    throw new AppError("No deliveries found", 404);
  }

  const logs = [`Total deliveries found: ${deliveries.length}`];

  const queue = [[{ startState: orderStartState, endState: orderStartState }]];
  const visitedStates = new Set();

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const currentEndState = currentPath[currentPath.length - 1].endState;

    if (currentEndState === orderEndState) {
      logs.push(`Successfully found delivery chain: ${currentPath.length - 1} trips`);

      const enrichedChain = currentPath.slice(1).map(trip => {
        const delivery = deliveries.find(delivery => delivery.trip.some(t => t._id.equals(trip._id)));
        return {
          ...trip.toObject(), // Convert Mongoose document to plain object
          deliveryPerson: {
            name: delivery.name,
            phone: delivery.phone,
            vehicleType: delivery.vehicleType,
            profileImage: delivery.profileImage // Add profile image here
          }
        };
      });

      return { chain: enrichedChain, logs };
    }

    visitedStates.add(currentEndState);

    for (const delivery of deliveries) {
      for (const trip of delivery.trip) {
        if (trip.startState === currentEndState && !visitedStates.has(trip.endState)) {
          const newPath = currentPath.concat([trip]);
          queue.push(newPath);
          logs.push(`Exploring trip from ${trip.startState} to ${trip.endState}`);
        }
      }
    }
  }

  throw new AppError("No valid delivery chain found", 400);
};

exports.chainDeliveries = catchAsync(async (req, res, next) => {
  const { orderStartState, orderEndState } = req.query;

  if (!orderStartState || !orderEndState) {
    return next(new AppError("Please provide both orderStartState and orderEndState.", 400));
  }

  try {
    const { chain, logs } = await findDeliveryChain(orderStartState, orderEndState);
    res.status(200).json({
      status: "success",
      results: chain.length,
      data: {
        deliveries: chain,
        logs: logs, // Include the logs in the response body for successful requests
      }
    });
  } catch (err) {
    if (err instanceof AppError) {
      // Return only status and message for AppError instances
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    next(err);
  }
});

