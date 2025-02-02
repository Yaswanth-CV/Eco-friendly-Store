// cartModel.js
const mongoose = require('mongoose');

// Define the cart schema
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to User model (if you have users in your system)
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference to Product model
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            }
        }
    ]
});

// Create and export the cart model
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
