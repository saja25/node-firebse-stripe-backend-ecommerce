"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmountAndCart = exports.compeleteOrder = exports.createOrder = exports.deleteCart = exports.storeStripeCustomerId = exports.getStripeCustomerId = exports.getProducts = void 0;
const admin = require("firebase-admin");
const CommonUtil_1 = require("./CommonUtil");
const PRODUCT_COLLECTION = "product";
const CUSTOMERS_COLLECTION = "customer";
const CART_COLLECTION = "cart";
const ORDER_COLLECTION = "order";
async function getProducts(ids) {
    try {
        if (ids && ids.length > 0) {
            const products = await admin
                .firestore()
                .collection(PRODUCT_COLLECTION)
                .where("id", "in", ids)
                .get();
            return products.docs.map((docs) => docs.data());
        }
        else {
            const products = await admin
                .firestore()
                .collection(PRODUCT_COLLECTION)
                .get();
            return products.docs.map((docs) => docs.data());
        }
    }
    catch (error) {
        console.log(error);
    }
    return [];
}
exports.getProducts = getProducts;
const getCart = async (user) => {
    const cartCollection = admin
        .firestore()
        .collection(CUSTOMERS_COLLECTION)
        .doc(user.uid)
        .collection(CART_COLLECTION);
    const cartFir = await cartCollection.get();
    const cart = cartFir.docs.map((doc) => doc.data());
    return { cart, cartCollection };
};
// this function get the id from firebase
const getStripeCustomerId = async (user) => {
    const customer = await admin
        .firestore()
        .collection(CUSTOMERS_COLLECTION)
        .doc(user.uid)
        .get();
    console.log("this is the cus data from server util", customer.data());
    return customer.data();
};
exports.getStripeCustomerId = getStripeCustomerId;
const storeStripeCustomerId = async (customerId, userUid) => {
    await admin.firestore().collection(CUSTOMERS_COLLECTION).doc(userUid).set({
        customer_id: customerId,
    });
};
exports.storeStripeCustomerId = storeStripeCustomerId;
const deleteCart = async (user) => {
    const snapshot = await admin
        .firestore()
        .collection(CUSTOMERS_COLLECTION)
        .doc(user.uid)
        .collection(CART_COLLECTION)
        .get();
    snapshot.docs.forEach((doc) => {
        doc.ref.delete();
    });
    // admin
    //   .firestore()
    //   .collection(CUSTOMERS_COLLECTION)
    //   .doc(userUid)
    //   .collection(CART_COLLECTION)
    //   .listDocuments()
    //   .then((val) => {
    //     val.map((val) => {
    //       val.delete();
    //     });
    //   });
};
exports.deleteCart = deleteCart;
const createOrder = (cart, paymentId, userUid, amount) => {
    const order = admin.firestore().collection(ORDER_COLLECTION).doc(paymentId);
    order.set({ user_uid: userUid, status: "initiated", amount: amount });
    const orderCart = order.collection(CART_COLLECTION);
    cart.forEach((product) => {
        orderCart
            .doc(product.id.toString())
            .set({ price: product.price, count: product.count });
    });
};
exports.createOrder = createOrder;
// completed orders will be shown in firebase
const compeleteOrder = async (paymentId) => {
    const order = admin.firestore().collection(ORDER_COLLECTION).doc(paymentId);
    order.update({ status: "Success" });
    const userUid = await (await order.get()).data().user_uid;
    await (0, exports.deleteCart)(userUid);
};
exports.compeleteOrder = compeleteOrder;
const getAmountAndCart = async (user) => {
    const { cart } = await getCart(user);
    const products = await getProducts(cart.map((data) => data.id));
    const combinedCart = (0, CommonUtil_1.getCombinedArray)(cart, products);
    return { amount: (0, CommonUtil_1.getPrice)(combinedCart), cart: combinedCart };
};
exports.getAmountAndCart = getAmountAndCart;
