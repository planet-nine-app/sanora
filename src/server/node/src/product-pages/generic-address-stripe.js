import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
//const genericAddressStripeHTML = fs.readFileSync(path.resolve('.', 'templates/generic.html'));
const genericAddressStripeHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'generic-address-stripe.html'));
await sessionless.generateKeys(() => {}, db.getKeys);

const genericAddressStripe = {
  htmlForProduct: async (product) => {
    const keys = await db.getKeys();
    const message = product.title + product.description + product.amount;
    const signature = await sessionless.sign(message);

    let productHTML = `${genericAddressStripeHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{productId}}/g, product.productId)
      .replace(/{{description}}/g, product.description)
      .replace(/{{image}}/g, ``https://${window.location.host}/images/${product.image}`)
      .replace(/{{amount}}/g, product.price)
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default genericAddressStripe;
