import { Cart, Product } from "../interface";

export const getCombinedArray = (cart: Cart[], products: Product[]) => {
  let compinedArray = [];
  for (let i = 0; i < cart.length; i++) {
    compinedArray.push({
      ...cart[i],
      ...products.find((item) => item.id === cart[i].id),
    });
    cart;
  }
  return compinedArray as Cart[];
};
export const getPrice = (cart: Cart[]) => {
  let amount = 0;
  cart.forEach((item) => {
    amount = item.price * item.count;
  });
  return amount * 100; // stripe requiers smalles unit of courrency
};
export const updateOrAdd = (old: Cart[], item: Cart) => {
  const i = old.findIndex((_item) => _item.id == item.id);
  if (i > -1) {
    old[i] = item;
  } else {
    old.push(item);
  }
  return [...old];
};
