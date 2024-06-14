const User = require("../models/User")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");


exports.approveDelivery = catchAsync(async (req, res, next) => {

    const delivery = await User.findOne
    ({ _id
    : req.body.deliveryId });
    if (!delivery) {
        return next(new AppError("Delivery not found", 404, "delivery", "Not found"));
    }
    delivery.deliveryApproved = true;
    await delivery.save();
    res.status(200).json({
        status: "success",
        data: {
            delivery,
        },
    });
});

exports.getDeliveries = catchAsync(async (req, res, next) => {
    const deliveries = await User.find({ deliveryApproved: true });
    res.status(200).json({
        status: "success",
        results: deliveries.length,
        data: {
            deliveries,
        },
    });
});