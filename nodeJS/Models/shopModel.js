const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: false,  // Optional field if some shops may not have an image
        trim: true
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt fields automatically
});

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
