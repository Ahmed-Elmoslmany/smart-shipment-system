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

  let order = await Order.create({ ...req.body, client: req.user.id });

  order.price = dis < 20 ? 20 : Math.ceil(dis * 0.5);

  order.save();

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

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "EGP",
            product_data: {
              name: `order type: ${order.type}\n order id: ${order._id}`,
            },
            unit_amount: order.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      success_url: `https://smart-shipment-system.vercel.com/${order.id}/success`,
      cancel_url: `https://smart-shipment-system.vercel.com/${order.id}/cancel`,
    });

    // res.json({ id: session. });

    // if()
    console.log(session);

    res.status(200).json({
      status: "success",
      data: {
        id: session.id,
        url: session.url,
        seccess_url: session.success_url,
        cancel_url: session.cancel_url,
        total_amount: session.amount_total,
        total_details: session.total_details,
      },
    });
  } catch (err) {
    console.error(err);
    new AppError(
      "Can't proccess payment on this moment please try again later",
      500,
      "paymanet",
      "issue"
    );
  }
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

  order.paidStatus = "canceled";

  order.save();

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});
