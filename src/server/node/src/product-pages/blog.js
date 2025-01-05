import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
//const genericHTML = fs.readFileSync(path.resolve('.', 'templates/generic.html'));
//const genericHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'generic.html'));
const blogHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'blog.html'));
await sessionless.generateKeys(() => {}, db.getKeys);

const blog = {
  htmlForProduct: async (product) => {
    const keys = await db.getKeys();
    const message = product.title + product.description + product.amount;
    const signature = await sessionless.sign(message);

    const markdown = await fs.readFileSync(product.content, 'utf-8');
    const content = marked.parse(markdown);

    let productHTML = `${blogHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{description}}/g, product.description)
      .replace(/{{content}}/g, content)
      .replace(/{{image}}/g, `${baseURL}images/${product.image}`)
      .replace(/{{amount}}/g, product.price)
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default blog;
