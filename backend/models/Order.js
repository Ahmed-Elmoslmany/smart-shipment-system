const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, "please provide order type"],
  },
  recipentName: {
    type: String,
    required: [true, "please provide recipient name"],
  },
  reciepentPhone: {
    type: String,
    required: [true, "please provide recipient phone number"],
    max: 12,
    min: 10,
  },
  senderName: {
    type: String,
    required: [true, "please provide sender name"],
  },
  senderPhone: {
    type: String,
    required: [true, "please provide sender phone number"],
    max: 12,
    min: 10,
  },
  startLoc: {
    type: pointSchema,
    required: true
  },
  currentLoc: {
    type: pointSchema,
    required: true
  },
  endLoc: {
    type: pointSchema
  },
  endLocation: {
    type: String,
    required: [true, "please provide end location"]
  },
  startLocation:{
    type: String,
    required: [true, "please provide start location"]
  },
  status: {
    type: String,
    enum: ["un-picked", "picked-up", "coming", "delivered"],
    default: "un-picked",
  },
  unPicked: {
    type: Boolean,
    default: true,
  },
  pickedUp: {
    type: Boolean,
    default: false,
  },
  coming: {
    type: Boolean,
    default: false,
  },
  delivered: {
    type: Boolean,
    default: false,
  },
  weight: String,
  quantity: Number,
  description: String,
  price: {
    type: String,
    get: (val) => (Math.ceil(val / 100)).toString(), // convert from piasters to pounds and ceil when retrieving
    set: (val) => (Math.ceil(parseFloat(val) * 100)).toString(), // convert from pounds to piasters and ceil when storing
  },
  paidStatus: {
    type: String,
    default: "un-paid",
  },
  delivery: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ startLoc: '2dsphere' });
orderSchema.index({ endLoc: '2dsphere' });

orderSchema.pre(/^find/, function(next) {
  this.populate('client').populate('delivery');
  next();
});

orderSchema.set('toJSON', { getters: true, virtuals: false });
orderSchema.set('toObject', { getters: true, virtuals: false });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
