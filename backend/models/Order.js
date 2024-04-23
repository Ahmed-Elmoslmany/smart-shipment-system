const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  type: {
    type: String,
    require: [true, "please provide order type"],
  },

  recipentName: {
    type: String,
    require: [true, "please provide reciepent name"],
  },
  reciepentPhone: {
    type: String,
    required: [true, "please provide reciepent phone number"],
    max: 12,
    min: 10,
  },
  senderName: {
    type: String,
    require: [true, "please provide sender name"],
  },
  senderPhone: {
    type: String,
    required: [true, "please provide sender phone number"],
    max: 12,
    min: 10,
  },
  delivery: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["un-picked", "picked-up", "coming", "delivered"],
    default: "un-picked"
  },
  unPicked: {
    type: Boolean,
    default: true
  },
  pickedUp:{
    type: Boolean,
    default: false
  },
  coming:{
    type: Boolean,
    default: false
  },
  delivered:{
    type: Boolean,
    default: false
  },
  fromLng: {
    type: String,
    require: [true, "please provide start location about the order"],
  },
  fromLat: {
    type: String,
    require: [true, "please provide start location about the order"],
  },
  toLng: {
    type: String,
    require: [true, "please provide end location about the order"],
  },
  toLat: {
    type: String,
    require: [true, "please provide end location about the order"],
  },
  weight: String,
  quantity: Number,
  description: String,
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
