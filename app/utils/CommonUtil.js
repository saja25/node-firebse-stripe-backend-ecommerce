"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrAdd = exports.getPrice = exports.getCombinedArray = void 0;
const getCombinedArray = (cart, products) => {
    let compinedArray = [];
    for (let i = 0; i < cart.length; i++) {
        compinedArray.push({
            ...cart[i],
            ...products.find((item) => item.id === cart[i].id),
        });
        cart;
    }
    return compinedArray;
};
exports.getCombinedArray = getCombinedArray;
const getPrice = (cart) => {
    let amount = 0;
    cart.forEach((item) => {
        amount = item.price * item.count;
    });
    return amount * 100; // stripe requiers smalles unit of courrency
};
exports.getPrice = getPrice;
const updateOrAdd = (old, item) => {
    const i = old.findIndex((_item) => _item.id == item.id);
    if (i > -1) {
        old[i] = item;
    }
    else {
        old.push(item);
    }
    return [...old];
};
exports.updateOrAdd = updateOrAdd;
