import crypto from 'crypto';
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
    product.productId = crypto.createHash('sha256').update(uuid + product.title).digest('hex');
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

  updateOrder: async (user, order) => {
    const userOrdersKey = `user:${user.uuid}:orders`;
    const ordersKey = `order:${order.productId}:orders`;

    const userOrdersJSON = (await client.get(userOrdersKey)) || '[]';
    const ordersJSON = (await client.get(ordersKey)) || '[]';

    const userOrders = JSON.parse(userOrdersJSON);
    const orders = JSON.parse(ordersJSON);

    const mappedUserOrders = userOrders.map($ => {
      if($.orderId === order.orderId) {
        return order;
      }
      return $;
    });

    const mappedOrders = orders.map($ => {
      if($.orderId === order.orderId) {
        return order;
      }
      return $;
    });

    await client.set(userOrdersKey, JSON.stringify(mappedUserOrders));
    await client.set(ordersKey, JSON.stringify(mappedOrders));

    return true;
  },

  putOrder: async (user, order) => {
    order.orderId = sessionless.generateUUID();

    const userOrdersKey = `user:${user.uuid}:orders`;
    const ordersKey = `order:${order.productId}:orders`;

    const userOrdersJSON = (await client.get(userOrdersKey)) || '[]';
    const ordersJSON = (await client.get(ordersKey)) || '[]';

    const userOrders = JSON.parse(userOrdersJSON);
    const orders = JSON.parse(ordersJSON);

    userOrders.push(order);
    orders.push(order);

    await client.set(userOrdersKey, JSON.stringify(userOrders));
    await client.set(ordersKey, JSON.stringify(orders));

    return true;
  },

  getOrdersForUser: async (user) => {
    const userOrdersKey = `user:${user.uuid}:orders`;

    const userOrdersJSON = (await client.get(userOrdersKey)) || '[]';

    return JSON.parse(userOrdersJSON);
  },

  getOrdersForProduct: async (productId) => {
    const ordersKey = `order:${productId}:orders`;

    const ordersJSON = (await client.get(ordersKey)) || '[]';

    return JSON.parse(ordersJSON);
  }

};

export default db;
