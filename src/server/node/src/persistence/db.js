import config from '../../config/local.js';
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
    await client.set(`${user.uuid}:product:${product.title}`, JSON.stringify(product));
    
    const titlesJSON = (await client.get(`products:${uuid}`)) || '{}';
    const titles = JSON.parse(titlesJSON);
    titles[product.title] = product;
    await client.set(`products:${uuid}`, JSON.stringify(titles));
    return product;
  },

  getProduct: async (uuid, title) => {
    const product = await client.get(`${uuid}:product:${title}`);
    if(!product) {
      throw new Error('not found');
    }
    return JSON.parse(product);
  }

};

export default db;
