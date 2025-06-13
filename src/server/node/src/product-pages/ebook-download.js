import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.baseURL || 'http://127.0.0.1:7243/';
//const ebookDownloadHTML = fs.readFileSync(path.resolve('.', 'templates/generic.html'));
const ebookDownloadHTML = fs.readFileSync(join(__dirname, '../..', 'templates', 'ebook-download.html'));
await sessionless.generateKeys(() => {}, db.getKeys);

const ebookDownload = {
  htmlForProduct: async (host, product) => {
    const keys = await db.getKeys();
    const message = product.title + product.description + product.amount;
    const signature = await sessionless.sign(message);
    let epubPath = './artifacts/';
    let pdfPath = './artifacts/';
    let mobiPath = './artifacts/';
    product.artifacts.forEach(artifact => {
      if(artifact.indexOf('epub') !== -1) {
        epubPath += artifact;
      }
      if(artifact.indexOf('pdf') !== -1) {
        pdfPath += artifact;
      }
      if(artifact.indexOf('mobi') !== -1) {
        mobiPath += artifact;
      }
    });

    let productHTML = `${ebookDownloadHTML}`;
    productHTML = productHTML.replace(/{{title}}/g, product.title)
      .replace(/{{productId}}/g, product.productId)
      .replace(/{{description}}/g, product.description)
      .replace(/{{image}}/g, `"https://${host}/images/${product.image}"`)
      .replace(/{{amount}}/g, product.price)
      .replace(/{{epubPath}}/g, epubPath)
      .replace(/{{pdfPath}}/g, pdfPath)
      .replace(/{{mobiPath}}/g, mobiPath)
      .replace(/{{pubKey}}/g, keys.pubKey)
      .replace(/{{signature}}/g, signature);

    return productHTML;
  }
};

export default ebookDownload;
