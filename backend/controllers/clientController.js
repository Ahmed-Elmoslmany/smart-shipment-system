const Order = require("../models/Order");
const User = require("../models/User")
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

exports.nearestDelivery = catchAsync(async (req, res, next) => {
  const users = await User.find({
    startLoc: {
      $near: {
        $geometry: { type: "Point", coordinates: [31.13498288424883, 33.8003659501793] },
        $minDistance: 1,
        $maxDistance: 500
      }
    }
  })
  

  
  if(!delivery){
    return next(new AppError("There is no delivery near to you, We will notify if they there", 400))
  }

  res.status(200).json({
    status: "success",
    results: delivery.length,
    data: {
      deliveries: delivery,
    },
  });
  console.log(delivery);
})