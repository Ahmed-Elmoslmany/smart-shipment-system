const User = require("../models/User")
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

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
4
exports.updateUserInfo = catchAsync(async (req, res, next) => {
    const user = await User.findOneAndUpdate
    ({ _id
    : req.body.userId }, req.body, {
        new: true,
        runValidators: true,
    });
    if (!user) {
        return next(new AppError("User not found", 404, "user", "Not found"));
    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});