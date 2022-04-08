const mongoose = require('mongoose')
const orderSchema = require('./schema')
const orderModel = mongoose.model("order", orderSchema)

module.exports = orderModel