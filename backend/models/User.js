const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const randomstring = require("randomstring");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Point"],
  },
  coordinates: {
    type: [Number],
  },
});

const tripSchema = new mongoose.Schema({
  startLoc: {
    type: pointSchema,
  },
  endLoc: {
    type: pointSchema,
  },
  startState: String,
  endState: String,
  time: String,
  duration: String,
  day: String,
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Please use a valid email address.",
    },
  },
  phone: {
    type: String,
    max: 12,
    min: 10,
  },
  address: String,
  profileImage: String,
  role: {
    type: String,
    enum: ["client", "fixed-delivery", "unorganized-delivery"],
  },
  currentState: {
    type: pointSchema,
  },
  vehicleType: String,
  vehicleLicenseImg: String,
  deliveryApprovalImg: String,
  deliveryApproved: {
    type: Boolean,
    default: false,
  },
  trip: [tripSchema],
  password: {
    type: String,
    require: [true, "User must have a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    require: [true, "User must have a password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetExpires: Date,
  OTP: String,
  otpResetExpires: Date,
  confirmedEmail: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
    select: false,
  },
});

userSchema.index({ "trip.startLoc": "2dsphere" });
userSchema.index({ "trip.endLoc": "2dsphere" });
userSchema.index({ "currentState": "2dsphere" });

userSchema.pre(/^find/, function (next) {
  this.select("-__v");
  next();
});

userSchema.pre("save", function (next) {
  if (!this.profileImage) {
    this.profileImage = `https://eu.ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&size=250`;
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  3;

  console.log("top:", this.otp);
  this.find({ $or: [{ OTP: { $exists: true } }, { active: { $ne: false } }] });

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfterCreatedToken = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createUserOTP = function () {
  const otp = randomstring.generate({
    length: 6,
    charset: "numeric",
  });

  this.OTP = otp;
  this.otpResetExpires = Date.now() + 10 * 60 * 1000;

  return otp;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
