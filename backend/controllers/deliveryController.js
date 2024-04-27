const Order = require("../models/Order");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");

const ordersSummary = (orders) => {
  const processedOrders = orders.map(order => ({
    type: order.type,
    client: order.client.name,
    description: order.description,
    status: order.status,
    weight: order.weight,
    quantity: order.quantity
  }))

  return processedOrders
}

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

exports.assignOrderToMe = catchAsync(async (req, res) => {
    await Order.findByIdAndUpdate(req.params.id, {delivery: req.user.id}, {new: true});

    res.status(200).json({
        status: "success",
        message: `order assigned you ${req.user.name} succussfully, Delivered it as fast as possible!`,
      });
})

exports.summary = catchAsync(async (req, res, nest) => {

  const features = new APIFeatures(Order.find({delivery: req.user.id}), req.query)
  .filter()
  .limitFields()
  .paginate();

  const orders = await features.query.populate('client')

  // const orders = await Order.find({delivery: req.user.id})

  const processedOrders = ordersSummary(orders) // clarify the data
  if(processedOrders.length > 0){
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders: processedOrders
      },
    });
  }{
    res.status(200).json({
      status: 'success',
      message: "There is no orders found"
    });
  }
})

