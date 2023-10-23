import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
var smtpConfig = {
  service: "gmail",
  // use SSL
  auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
};
const transporter = nodemailer.createTransport(smtpConfig);
const postProduct = async (req, res, next) => {
  console.log(req.body);
  const { name, description, category, price, days, ownerName } = req.body;
  const userId = req.body.id;

  let image = "uploads/" + req.file.filename;
  cloudinary.v2.uploader.upload(
    image,

    async function (error, result) {
      if (error) {
        console.log(error);
      } else {
        image = result.secure_url;
        console.log(result);
      }

      const category_id = await Category.findOne({ category_name: category });
      const offers = [];

      const product = await Product.create({
        name,
        description,
        image,
        ownerName,
        price,
        offers,
        category: category_id.category_name,
        days,
        user: userId,
      });

      User.findById(userId).then((user) => {
        if (user !== null) {
          user.products.push(product._id);
          user.save();
        }
      });

      if (product) {
        console.log(product);
        return res.status(200).json({
          id: product._id,
          description: product.description,
          name: product.name,
          category: product.category,
          image: product.image,
          ownerName: product.ownerName,
          price: product.price,
          days: product.days,
          user: product.user,
        });
      } else {
        return res.status(400);
      }
    }
  );
};

const getAllProduct = asyncHandler(async (req, res, next) => {
  const allProduct = await Product.find();
  console.log(allProduct);
  res.status(200).json({ allProduct: allProduct });
});

const getProductById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  res.status(200).json({ product: product });
});
const getUserProduct = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  const userproductsid = user.products;
  const allproduct = await Product.find();

  const userproducts = await Product.find()
    .where("_id")
    .in(userproductsid)
    .exec();

  res.status(200).json({ userproduct: userproducts });
});

const postOffer = asyncHandler(async (req, res, next) => {
  const productid = req.params.id;
  const product = await Product.findById(productid);
  const { userid, offerprice, username, userEmail, userPhoneNo } = req.body;
  console.log(req.body);
  product.offers.push({
    user: userid,
    userEmail: userEmail,
    userPhoneNo: userPhoneNo,
    offerprice: offerprice,
    username: username,
  });
  product.save();
  res.status(200).json({
    message: "success",
  });
});

const getoffer = asyncHandler(async (req, res, next) => {
  const productid = req.params.id;
  const product = await Product.findById(productid);
  const { offers } = product;
  res.status(200).json({
    offers: offers,
  });
});
const rejectOffer = asyncHandler(async (req, res) => {
  const offerId = req.body.offerId;
  const productId = req.body.productid;

  try {
    const product = await Product.findById(productId);
    product.offers = product.offers.filter(
      (offer) => offer._id.toString() !== offerId.toString()
    );

    await product.save();

    res.status(200).json({ message: "Offer rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const acceptOffer = asyncHandler(async (req, res, next) => {
  const productid = req.params.id;
  const product = await Product.findById(productid);
  const offer_id = req.body.offer_id;
  const correctoffer = product.offers.find((offer) => offer._id == offer_id);

  console.log(correctoffer);
  if (correctoffer) {
    product.sold = true;
    product.offers = [];
    product.offers.push(correctoffer);
    product.price = correctoffer.offerprice;
    product.save();

    // Send email to the user whose offer was accepted
    const userMailOptions = {
      from: "medigo777@gmail.com",
      to: correctoffer.userEmail, // Use the correct user's email
      subject: "Your Offer was Accepted",
      html: `
        <html>
          <body>
            <h1>Hello ${correctoffer.username},</h1>
            <p>Your offer has been accepted for the product : ${product.name}.</p>
            <p>Offer Price: ₹${correctoffer.offerprice}</p>
            <p>The seller will contect you for further details.</p>
            <p>Thank you for using RentIT. Have a nice day.</p>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(userMailOptions, (err, userRes) => {
      if (err) {
        console.log(err);
      } else {
        console.log("User notification email sent successfully");
      }
    });

    // Send email to the user who accepted the offer
    const sellerMailOptions = {
      from: "medigo777@gmail.com",
      to: req.body.userData.email,
      subject: "Offer Details",
      html: `
        <html>
          <body>
            <h1>Hello ${req.body.userData.name},</h1>
            <p>Here are the details of the deal:</p>
            <ul>
              <li>Name: ${correctoffer.username}</li>
              <li>Email: ${correctoffer.userEmail}</li>
              <li>Phone Number: ${correctoffer.userPhoneNo}</li>
              <li>Offer Price: ₹${correctoffer.offerprice}</li>
            </ul>
            <h3>You can use these details for further communication.</h3><br />
            <p>Thank you for using RentIT. Have a nice day.</p>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(sellerMailOptions, (err, sellerRes) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Seller notification email sent successfully");
      }
    });

    return res.status(200).json({
      message: "offer accepted",
    });
  } else {
    return res.status(400).json({
      message: "no offer found",
    });
  }
});

const userOrders = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.find({ "offers.user": id });
  res.status(200).json({
    product: product,
  });
});

const getMarkSold = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  product.sold = true;
  product.save();
  return res.status(200).json({
    message: "Marked As Sold",
  });
});

export {
  postProduct,
  getAllProduct,
  getProductById,
  getUserProduct,
  postOffer,
  getoffer,
  acceptOffer,
  userOrders,
  rejectOffer,
  getMarkSold,
};
