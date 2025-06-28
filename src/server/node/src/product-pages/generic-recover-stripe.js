import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
//const genericRecoverStripeHTML = fs.readFileSync(path.resolve('.', 'templates/generic.html'));
const genericRecoverStripeHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'generic-recover-stripe.html'));
await sessionless.generateKeys(() => {}, db.getKeys);

const genericRecoverStripe = {
  htmlForProduct: async (host, product) => {
    const keys = await db.getKeys();
    await sessionless.generateKeys(() => {}, db.getKeys);
    sessionless.getKeys = db.getKeys;
    const message = product.title + product.price;
    const signature = await sessionless.sign(message);

    let productHTML = `${genericRecoverStripeHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{productId}}/g, product.productId)
      .replace(/{{description}}/g, product.description)
      .replace(/{{image}}/g, `"https://${host}/images/${product.image}"`)
      .replace(/{{amount}}/g, product.price)
      .replace(/{{formattedAmount}}/g, (product.price / 100))
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default genericRecoverStripe;
