const Order = require("../models/Order");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createOrder = catchAsync(async (req, res) => {
  const order = await Order.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {

  const id = req.params.id;
  const status = req.query.status;

  try {
    switch (status) {
      case "pickedup":
        await Order.findByIdAndUpdate(
            id,
            {
              status: "picked-up",
              pickedUp: true,
              unPicked: false,
            },
            { new: true, runValidators: true }
          );
        break;

        case "coming":
        await Order.findByIdAndUpdate(
            id,
            {
              status: "coming",
              coming: true,
              pickedUp: false,
            },
            { new: true, runValidators: true }
          );
        break;

        case "delivered":
        await Order.findByIdAndUpdate(
            id,
            {
              status: "delivered",
              delivered: true,
              coming: false,
            },
            { new: true, runValidators: true }
          );
        break;

      default:
            return next(new AppError(`Please provide valid order status, the ${status} is unvalid`, 400))
        break;
    }
  } catch (error) {
    return next(new AppError(`Oops can't update order status at this moment, please try again later`, 400))
  }

  res.status(200).json({
    status: "success",
    message: "order status updated succussfully",
  });
});

