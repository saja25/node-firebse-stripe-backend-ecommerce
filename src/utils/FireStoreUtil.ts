import admin = require("firebase-admin");
import { Cart, Product } from "../interface";
import { getCombinedArray, getPrice } from "./CommonUtil";

const PRODUCT_COLLECTION = "product";
const CUSTOMERS_COLLECTION = "customer";
const CART_COLLECTION = "cart";
const ORDER_COLLECTION = "order";
export async function getProducts(ids: number[]): Promise<Product[]> {
  try {
    if (ids && ids.length > 0) {
      const products = await admin
        .firestore()
        .collection(PRODUCT_COLLECTION)
        .where("id", "in", ids)
        .get();
      return products.docs.map((docs) => docs.data()) as Product[];
    } else {
      const products = await admin
        .firestore()
        .collection(PRODUCT_COLLECTION)
        .get();
      return products.docs.map((docs) => docs.data()) as Product[];
    }
  } catch (error) {
    console.log(error);
  }
  return [];
}

const getCart = async (
  user: any
): Promise<{ cart: Cart[]; cartCollection: any }> => {
  const cartCollection = admin
    .firestore()
    .collection(CUSTOMERS_COLLECTION)
    .doc(user.uid)
    .collection(CART_COLLECTION);
  const cartFir = await cartCollection.get();
  const cart = cartFir.docs.map((doc) => doc.data()) as Cart[];
  return { cart, cartCollection };
};
// this function get the id from firebase
export const getStripeCustomerId = async (user) => {
  const customer = await admin
    .firestore()
    .collection(CUSTOMERS_COLLECTION)
    .doc(user.uid)
    .get();
  console.log("this is the cus data from server util", customer.data());
  return customer.data();
};
export const storeStripeCustomerId = async (
  customerId: string,
  userUid: string
) => {
  await admin.firestore().collection(CUSTOMERS_COLLECTION).doc(userUid).set({
    customer_id: customerId,
  });
};

export const deleteCart = async (user) => {
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

export const createOrder = (
  cart: Cart[],
  paymentId: string,
  userUid: string,
  amount: number
) => {
  const order = admin.firestore().collection(ORDER_COLLECTION).doc(paymentId);
  order.set({ user_uid: userUid, status: "initiated", amount: amount });
  const orderCart = order.collection(CART_COLLECTION);
  cart.forEach((product) => {
    orderCart
      .doc(product.id.toString())
      .set({ price: product.price, count: product.count });
  });
};
// completed orders will be shown in firebase
export const compeleteOrder = async (paymentId: string) => {
  const order = admin.firestore().collection(ORDER_COLLECTION).doc(paymentId);
  order.update({ status: "Success" });
  const userUid = await (await order.get()).data().user_uid;
  await deleteCart(userUid);
};

export const getAmountAndCart = async (user) => {
  const { cart } = await getCart(user);
  const products = await getProducts(cart.map((data) => data.id));
  const combinedCart = getCombinedArray(cart, products);
  return { amount: getPrice(combinedCart), cart: combinedCart };
};
