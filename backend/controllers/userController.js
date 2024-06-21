const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const cloudinary = require("../utils/cloud");
const factory = require("./factoryHandler");
const sendEmail = require("../utils/email");
const filterObj = require("../utils/filterObj");

exports.uploadProfileImg = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  user.profileImage = req.body.profileImage;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  const filteredBody = filterObj(req.body, "name", "email", "phone", "address");

  if (filteredBody.email && filteredBody.email !== req.user.email) {
    const existingUser = await User.findOne({ email: filteredBody.email });
    if (existingUser) {
      return next(
        new AppError(
          "This email is already in use. Please use another email.",
          400
        )
      );
    }

    const updatedUser = await User.findById(req.user.id);
    const signUpOTP = updatedUser.createUserOTP();
    updatedUser.confirmedEmail = false;
    updatedUser.email = filteredBody.email;

    await updatedUser.save({ validateBeforeSave: false });

    const message = `Here is your OTP: ${signUpOTP}\nPlease confirm your account.`;

    try {
      await sendEmail({
        email: filteredBody.email,
        subject: "Your OTP for email update (valid for 10 mins!)",
        message,
      });

      res.status(200).json({
        status: "success",
        message:
          "OTP has been sent to your new email address. Please confirm your email.",
      });

      return;
    } catch (error) {
      updatedUser.OTP = undefined;
      updatedUser.otpResetExpires = undefined;
      await updatedUser.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  } else {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  }
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = factory.getOne(User);
