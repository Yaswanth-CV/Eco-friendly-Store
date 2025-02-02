const express = require('express')
const {mongoose} = require('mongoose')
const dotenv = require('dotenv').config()
const cors = require('cors');
const Shop = require('./Models/shopModel')
const Product = require('./Models/ProductModel')
const dbConnect = require('./config/dbConnect')
const User =require('./Models/userModel')
const Cart = require('./Models/cartModel');
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
});

const app = express()
app.use(express.json())
app.use(cors());

dbConnect()



app.get("/register", async (req, res) => {
    try {
        const { username, email, password } = req.query;

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(403).send("Email already exists");
        }

        // Save the new user
        const user = new User({ username, email, password });
        await user.save();

        res.status(201).send("User registered successfully");
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send("Internal Server Error");
    }
});

const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

app.get("/login", async (req, res) => {
    try {
        const { email, password } = req.query;

        if (!email || !password) {
            return res.status(400).send("Email and password are required");
        }

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send("Invalid email or password");
        }

        // Compare the provided password with the stored password
        if (password !== user.password) {
            return res.status(401).send("Invalid email or password");
        }

        // Generate a token
        const token = generateToken(user);

        // Return user details along with the token
res.status(200).json({ userId: user._id, username: user.username, email: user.email, token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal Server Error");
    }
});






app.get('/shops', async (req, res)=>{
    const shops = await Shop.find()
    res.json(shops);

})

app.get('/shop/:id/products', async (req, res) => {
    const { id } = req.params;

    try {
        console.log(`Looking for products for shop ID: ${id}`);

        const shopId = new mongoose.Types.ObjectId(id);

        // Assuming 'id' is a valid ObjectId
        const products = await Product.find({ shop: shopId });  

        res.status(200).json(products);
    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ message: 'Error retrieving products', error: error.message });
    }
});

app.post('/products', async (req, res) => {

    try {       
        // Save the product to the database
        const newProduct = await Product.insertMany(req.body)

        // Return the created product
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
});

app.delete('/products', async(req, res) => {
    await Product.deleteMany()
    res.send('products deleted')
})


// app.get('/products', async(req, res) => {
//     const products = await Product.find()

//     res.json(products)
// })

// Modify the GET /products route to accept a shopId query
app.get('/products', async (req, res) => {
    const shopId = req.query.shopId;  // Extract the shopId from the query string

    try {
        // Fetch products based on shopId
        const products = shopId 
            ? await Product.find({ shopId })  // Filter by shopId if provided
            : await Product.find();  // Return all products if no shopId

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});


app.get('/cart/:id', async (req, res) => {
    const userId = req.params.id;

    try{
        const cart = await Cart.findOne({ userId }).populate('products.productId');

        // If the cart is not found, return an empty response
        if (!cart || cart.products.length === 0) {
            return res.status(404).json({ message: 'Cart is empty' });
        }

        // Return the cart with populated product details
        res.status(200).json(cart);

    } catch (error) {
        console.error('Error adding products to cart:', error);
        res.status(500).json({message: 'Error adding products to cart', error: error.message});
    }

});


app.post('/cart', async (req, res) => {
    const { userId, productId } = req.body; // Assume productId is being sent in the request body

    if (!userId || !productId) {
        return res.status(400).json({ message: 'User ID and Product ID are required' });
    }

    try {
        // Find the cart for the user
        let cart = await Cart.findOne({ userId });

        // If the cart doesn't exist, create a new one
        if (!cart) {
            cart = new Cart({ userId, products: [] });
        }

        // Check if the product is already in the cart
        const existingProductIndex = cart.products.findIndex(item => item.productId.toString() === productId);

        if (existingProductIndex > -1) {
            // If product exists, you might want to increment the quantity instead
            cart.products[existingProductIndex].quantity += 1; // Assuming you have a quantity field
        } else {
            // If product does not exist, add it to the cart
            cart.products.push({ productId, quantity: 1 }); // Assuming a default quantity of 1
        }

        // Save the cart
        await cart.save();

        res.status(200).json({ message: 'Product added to cart successfully', cart });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
});




// llllll

// app.post('/cart', authenticateToken, async (req, res) => {
//     const { userId, productId } = req.body; 

//     if (!userId || !productId) {
//         return res.status(400).json({ message: 'User ID and Product ID are required' });
//     }

//     try {
//         let cart = await Cart.findOne({ userId: req.user.id }); // Access user ID from the token payload
//         if (!cart) {
//             cart = new Cart({ userId: req.user.id, products: [] });
//         }

//         const existingProductIndex = cart.products.findIndex(item => item.productId.toString() === productId);
//         if (existingProductIndex > -1) {
//             cart.products[existingProductIndex].quantity += 1;
//         } else {
//             cart.products.push({ productId, quantity: 1 });
//         }

//         await cart.save();
//         res.status(200).json({ message: 'Product added to cart successfully', cart });
//     } catch (error) {
//         console.error('Error adding product to cart:', error);
//         res.status(500).json({ message: 'Error adding product to cart', error: error.message });
//     }
// });

app.delete('/cart/:userId/product/:productId', async (req, res) => {
    const userId = req.params.userId;
    const productId = req.params.productId;

    try {
        // Find the cart for the user
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove the product from the cart
        cart.products = cart.products.filter(item => item.productId.toString() !== productId);

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: 'Product removed from cart', cart });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Error removing product from cart', error: error.message });
    }
});


app.post('/order', async (req, res) => {
    const { userId, products, totalAmount } = req.body;

    if (!userId || !products || !totalAmount) {
        return res.status(400).json({ message: 'User ID, products, and total amount are required' });
    }


    const productDetails = products.map(product => 
        `Name: ${product.name},
        Quantity: ${product.quantity},
        Price: ₹${product.price.toFixed(2)}`
    ).join('<br>');


    const user = await User.findById(userId); // Assuming you have a User model to fetch user data

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Prepare the email content
    const mailOptions = {
        from: 'parthivreddy.pelluru2005@gmail.com',
        to: 'cvyaswanth@gmail.com', // Admin's email address
        subject: 'New Order Received',
        text: `New order from ${user.username} (${user.email})\nProducts: ${JSON.stringify(productDetails)}\nTotal Amount: ₹${totalAmount.toFixed(2)}`,
    };

    try {
        // Send the email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Order placed successfully. You will receive a confirmation mail shortly.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
});



// Endpoint to handle contact form submission


// ll

// app.post('/order', authenticateToken, async (req, res) => {
//     const { products, totalAmount } = req.body;

//     if (!products || !totalAmount) {
//         return res.status(400).json({ message: 'Products and total amount are required' });
//     }

//     try {
//         const productDetails = products.map(product => 
//             `Name: ${product.name}, Quantity: ${product.quantity}, Price: ₹${product.price.toFixed(2)}`
//         ).join('<br>');

//         const user = await User.findById(req.user.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const mailOptions = {
//             from: 'parthivreddy.pelluru2005@gmail.com',
//             to: 'cvyaswanth@gmail.com',
//             subject: 'New Order Received',
//             text: `New order from ${user.username} (${user.email})\nProducts: ${productDetails}\nTotal Amount: ₹${totalAmount.toFixed(2)}`,
//         };

//         await transporter.sendMail(mailOptions);
//         res.status(200).json({ message: 'Order placed successfully. Notification sent to admin.' });
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ message: 'Error placing order', error: error.message });
//     }
// });



app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    // Configure the transporter with your Gmail credentials
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'parthivreddy.pelluru2005@gmail.com',  // Replace with your Gmail
            pass: 'tyiy dguh uidt cvhc'          // Replace with your Gmail password or app password
        }
    });

    // Set up email data
    let mailOptions = {
        from: email,
        to: 'cvyaswanth@gmail.com', // Recipient email (your email to receive contact forms)
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        } else {
            res.status(200).json({ success: true, message: 'Email sent successfully!' });
        }
    });
});


app.listen(3001, () => {
    console.log('server is running on port 3001')
})