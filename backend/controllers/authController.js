const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const User = require("./../models/User");
const catchAsync = require("./../utils/catchAsync");
const sendEmail = require("./../utils/email");
const cloudinary = require("../utils/cloud");


const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_JWT, {
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_Cookie_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // this mean the cookie can't access or modified in anyway in the browser
    httpOnly: true,
  };

  // this line mean when we on production mode add 'secure' proberty to cookie options to make it secure and send only on encrypted connection
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // remove password from output response
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  
 
  const newUser = await User.create(req.body);
  


  const signUpOTP = newUser.createUserOTP();

  await newUser.save({ validateBeforeSave: false });

  console.log(signUpOTP);
  const message = `Here is your OTP: ${signUpOTP}\n, Please confrim your account`;

  try {
    await sendEmail({
      email: newUser.email,
      subject: "Your OPT for the registration (valid for 10 mins!)",
      message,
    });

    res.status(201).json({
      status: "success",
      message:
        "Registration OTP send to your email, Please confirm youe account",
    });
  } catch (error) {
    // Set OTP and expire data to "undifined" if error occur
    newUser.OTP = undefined;
    newUser.passwordResetExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "Oops it seems an error on our server, Please try again later",
        500
      )
    );
  }
});

exports.confirmAccount = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) return next(new AppError("Please provide email and OTP", 400));
  
  const user = await User.findOne({email});
  console.log(user);
  if (!user) return next(new AppError("There is not user with this email!", 400));

  if(user.confirmedEmail) return next(new AppError("Email is already confirmed, Enjoy!", 400));

  

  if(otp === user.OTP) {
    user.confirmedEmail = true
    user.active = true
    user.OTP = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
  }else{
    return next(new AppError("Please provide a valid OTP!", 400));
  }



  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email && !password) {
    return next(new AppError("Please provide a email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password)) || !user.confirmedEmail) {
    return next(new AppError("Please provide correct email and password, or confirm your email before login", 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("you aren't logged, please login in to get access", 401)
    );
  }

  const decodedToekn = await promisify(jwt.verify)(
    token,
    process.env.SECRET_JWT
  );

  // Check if user not deleted after create the token
  const currentUser = await User.findById(decodedToekn.id);

  if (!currentUser) {
    return next(
      new AppError("the user belonging to the token does no longer exist", 401)
    );
  }

  // Check if user change password after the token was created
  if (currentUser.passwordChangedAfterCreatedToken(decodedToekn.iat)) {
    return next(
      new AppError("User recently changed password, Please login again", 401)
    );
  }

  // Finally access to proteced route, and put user data in request for get access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("there are no user with this email", 404));
  }

  // generate password reset OTP
  const OTP = user.createUserOTP();

  await user.save({ validateBeforeSave: false });

  // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `This is your OTP to reset your password ${OTP}\n Please ignore this email if you not ask for reset your password :)`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password Recovrey (valid for 10 mins!)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Reset OTP send to your email",
    });
  } catch (error) {
    // Set OTP and expire data to "undifined" if error occur
    user.OTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "Oops it seems an error on our server, Please try again later",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    OTP: req.body.otp,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);
  // check token expire and user exist and set new password
  if (!user) {
    return next(new AppError("Invalid token or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.OTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // update changePasswordAt for current user

  // log the user in, send JWT to client
  createSendToken(user, 200, res);
});

exports.updateMyPassword = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // check if current password is same as the password in database
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // check if current password is equal the new password
  if (req.body.currentPassword === req.body.newPassword) {
    return next(
      new AppError(
        "Your new password should be different from the current password",
        400
      )
    );
  }

  // check if current password is not equal the new password confirm
  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    return next(
      new AppError(
        "Your new password and confirm password should be the same",
        400
      )
    );
  }
  // if so, update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  // User.findbyIdAndUpdate will not work for reasons we discuss

  // log user in, send JWT back to user
  createSendToken(user, 200, res);
};
