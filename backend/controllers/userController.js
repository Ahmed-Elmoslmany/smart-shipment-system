const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const cloudinary = require("../utils/cloud");
const factory = require("./factoryHandler");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.uploadProfileImg = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path);
    user.profileImage.secureUrl = secure_url;
    user.profileImage.publicId = public_id;
    user.save();
  } else {
    return next(new AppError('Please upload a profile image', 400, "profileImage", "Validation"));
  }

  res.status(200).json({
    status: "success",
    data: {
      user
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('You cannot update password here', 400, "password", "Validation"));
  }

  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getUser = factory.getOne(User);
