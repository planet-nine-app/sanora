import { createClient } from './client.js';
import sessionless from 'sessionless-node';
  
const client = await createClient()
  .on('error', err => console.log('Client Error', err))
  .connect();
    
const db = {
  getUserByUUID: async (uuid) => {
    const user = await client.get(`user:${uuid}`);
    if(!user) {
console.log('throwing');
      throw new Error('not found');
    }
    let parsedUser = JSON.parse(user);
    return parsedUser; 
  },

  getUserByPublicKey: async (pubKey) => {
    const uuid = await client.get(`pubKey:${pubKey}`);
    const user = await client.get(`user:${uuid}`);
    if(!user) {
      throw new Error('not found');
    }
    let parsedUser = JSON.parse(user);
    return parsedUser; 
  },

  putUser: async (user) => {
    const uuid = sessionless.generateUUID();
    user.uuid = uuid;
    await client.set(`user:${uuid}`, JSON.stringify(user));
    await client.set(`pubKey:${user.pubKey}`, uuid);
    return user;
  },

  saveUser: async (user) => {
    await client.set(`user:${user.uuid}`, JSON.stringify(user));
    return true;
  },

  deleteUser: async (user) => {
    await client.del(`pubKey:${user.pubKey}`);
    const resp = await client.del(`user:${user.uuid}`);

    return true;
  },

  saveKeys: async (keys) => {
    await client.set(`keys`, JSON.stringify(keys));
  },

  getKeys: async () => {
    const keyString = await client.get('keys');
    return JSON.parse(keyString);
  },

  putProduct: async (user, product) => {
console.log('putting product', product);
    const uuid = user.uuid;
    product.uuid = uuid;
    product.productId = sessionless.generateUUID();
    await client.set(`${user.uuid}:product:${product.title}`, JSON.stringify(product));
    
    const productsJSON = (await client.get(`products:${uuid}`)) || '{}';
    const products = JSON.parse(productsJSON);
    products[product.title] = product;
    await client.set(`products:${uuid}`, JSON.stringify(products));
    return product;
  },

  getProducts: async (uuid) => {
    const productsJSON = (await client.get(`products:${uuid}`)) || '{}';
    const products = JSON.parse(productsJSON);
    return products;
  },

  getProduct: async (uuid, title) => {
    const product = await client.get(`${uuid}:product:${title}`);
    if(!product) {
      throw new Error('not found');
    }
    return JSON.parse(product);
  },

  putOrder: async (user, order) => {
    const userOrdersKey = `user:${user.uuid}:orders`;
    const productOrdersKey = `product:${order.productId}:orders`;

    const userOrdersJSON = (await client.get(userOrdersKey)) || '[]';
    const productOrdersJSON = (await client.get(productOrdersKey)) || '[]';

    const userOrders = JSON.parse(userOrdersJSON);
    const productOrders = JSON.parse(productOrdersJSON);

    userOrders.push(order);
    productOrders.push(order);

    await client.set(userOrdersKey, JSON.stringify(userOrders));
    await client.set(productOrdersKey, JSON.stringify(productOrders));

    return true;
  },

  getOrdersForUser: async (user) => {
    const userOrdersKey = `user:${user.uuid}:orders`;

    const userOrdersJSON = (await client.get(userOrdersKey)) || '[]';

    return JSON.parse(userOrdersJSON);
  },

  getOrdersForProduct: async (productId) => {
    const productOrdersKey = `product:${productId}:orders`;

    const productOrdersJSON = (await client.get(productOrdersKey)) || '[]';

    return JSON.parse(productOrdersJSON);
  }

};

export default db;
