import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
//const ebookDownloadHTML = fs.readFileSync(path.resolve('.', 'templates/generic.html'));
const ebookDownloadHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'generic-recover-stripe.html'));
await sessionless.generateKeys(() => {}, db.getKeys);

const ebookDownload = {
  htmlForProduct: async (product) => {
    const keys = await db.getKeys();
    const message = product.title + product.description + product.amount;
    const signature = await sessionless.sign(message);

    let productHTML = `${ebookDownloadHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{productId}}/g, product.productId)
      .replace(/{{description}}/g, product.description)
      .replace(/{{image}}/g, "`https://${window.location.host}/images/" + `${product.image}` + "`")
      .replace(/{{amount}}/g, product.price)
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default ebookDownload;
