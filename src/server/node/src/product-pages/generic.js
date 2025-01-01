import fs from 'fs';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
const genericHTML = fs.readFileSync('./templates/generic.html');
await sessionless.generateKeys(() => {}, db.getKeys);


const generic = {
  htmlForProduct: async (product) => {
    const keys = await db.getKeys();
    const message = product.title + product.description + product.amount;
    const signature = await sessionless.sign(message);

    let productHTML = `${genericHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{description}}/g, product.description)
      .replace(/{{image}}/g, `${baseURL}images/${product.image}`)
      .replace(/{{amount}}/g, product.price)
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default generic;
