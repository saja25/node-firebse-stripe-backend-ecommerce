import express = require("express");
import admin = require("firebase-admin");
import bodyParser = require("body-parser");
import stripeFile = require("./files/stripe.json");
import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import {
  compeleteOrder,
  createOrder,
  deleteCart,
  getAmountAndCart,
  getStripeCustomerId,
  storeStripeCustomerId,
} from "./utils/FireStoreUtil";

const serviceAccount = require("./files/ecommerce-react-native-proj-firebase-adminsdk-mvy4h-15f32957ac.json");

// stripe initiation

const stripe = new Stripe(stripeFile.secretKey, {
  apiVersion: "2020-08-27",
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://ecommerce-react-native-proj-default-rtdb.firebaseio.com/",
  databaseAuthVariableOverride: {
    uid: "nameserver",
  },
});
// initiate express app
const app = express();
app.post("/add/user", async (req: Request, res: Response) => {
  ///////////// here we extract the token and call it user
  let user;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
      const decodeIdToken = await admin.auth().verifyIdToken(idToken);
      user = decodeIdToken;
    } catch (error) {
      console.log(error);
    }
  }
  ////////////
  //////////// here we will add user to stripe customer
  console.log("saja this is the server user"); ///////////////
  if (!user) res.status(403).send("you must be logged in");
  const customer = await stripe.customers.create({ email: user.email });
  if (customer) {
    storeStripeCustomerId(customer.id, user.uid);
    res.status(200).send({ status: "ok" });
  }
  console.log("saja this is the server customer", customer); ////////////
});

app.post("/checkout", async (req: Request, res: Response) => {
  /////////////
  let user;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
      const decodeIdToken = await admin.auth().verifyIdToken(idToken);
      user = decodeIdToken;
    } catch (error) {
      console.log(error);
    }
  }
  ////////////
  if (!user) res.status(403).send("you must be logged in");
  const { customer_id } = await getStripeCustomerId(user); // this function get the id from firebase
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer_id },
    { apiVersion: "2020-08-27" }
  );
  const { amount, cart } = await getAmountAndCart(user);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "USD",
    customer: customer_id,
  });
  createOrder(cart, paymentIntent.id, user.uid, amount);
  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer_id,
  });
});
// hrer the finished payments wellbbe apdated in firebase
app.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  async (request: Request, response: Response) => {
    const sig = request.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        "whsec_JATHTzokCGj0mtxrKArNoixlOGPXCrPm"
      );
    } catch (error) {
      response.status(400).send(`Webhook error ${error.message}`);
    }
    switch (
      event.type //this is the end
    ) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await compeleteOrder(paymentIntent.id);
        break;
      default:
        console.log("unhandeled event type", event.type);
    }
    response.json({ received: true });
  }
);
//// delete cart without purchaes - i added this
app.post("/delete/cart", async (req: Request, res: Response) => {
  ///////////// here we extract the token and call it user
  let user;
  if (req.headers?.authorization?.startsWith("Bearer")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    try {
      const decodeIdToken = await admin.auth().verifyIdToken(idToken);
      user = decodeIdToken;
    } catch (error) {
      console.log(error);
    }
  }
  ////////////
  console.log("saja this is the server user"); ///////////////
  if (!user) res.status(403).send("you must be logged in");
  deleteCart(user);
  res.status(200).send({ cartDeleted: "Success" });
  // res.json({
  //   cartDeleted: "Success",
  // });
});
const port = 4242;
app.listen(port, () => {
  console.log("node server listening to port  " + port);
});
