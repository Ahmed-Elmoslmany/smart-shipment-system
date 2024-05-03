const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const randomstring = require("randomstring");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
  },
  coordinates: {
    type: [Number],
  }
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
  },
  phone: {
    type: String,
    // required: [true, "Phone is required"],
    max: 12,
    min: 10,
  },
  address: String,
  profileImage: {
    secureUrl: String,
    publicId: String,
  },
  role: {
    type: String,
    enum: ["client", "fixed-delivery", "unorganized-delivery", "admin"],
  },

  // Unorganized Delivery
  geoState: String,

  // Common on Unorganized and fixed delivery
  vehicleType: String,
  vehicleLicense: String,
  deliveryApprovalImg: String,
  deliveryApproved: {
    type: Boolean,
    default: false
  },

  // Fixed Delivery
  startLoc: {
    type: pointSchema,
    required: true
  },
  endLoc: {
    type: pointSchema,
    required: true
  },
  geoStateStart: String,
  geoStateEnd: String,
  tripTime: String,
  tripPeriod: Array,

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
  OTP: String,
  passwordResetExpires: Date,
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

userSchema.index({ startLoc: '2dsphere' });
userSchema.index({ endLoc: '2dsphere' });

userSchema.pre(/^find/, function (next) {
  this.select("-__v");
  next();
});

userSchema.pre("save", async function (next) {
  // function will excute only if password modified
  if (!this.isModified("password")) return next();

  // hashed password
  this.password = await bcrypt.hash(this.password, 12);

  // no longer need passwordConfirmed because we checked confirmed before
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", async function (next) {
  // function will excute only if password is notmodified or document is not new
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// excute before any query starts with 'find', so include findByIdAndUpdate
userSchema.pre(/^find/, function (next) {
  3;

  console.log("top:", this.otp);
  // ex: select all users that active proberty set to true
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
  // Generate OTP
  const otp = randomstring.generate({
    length: 6,
    charset: "numeric",
  });

  this.OTP = otp;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return otp;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
