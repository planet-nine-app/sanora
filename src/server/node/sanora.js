import express from 'express';
import fileUpload from 'express-fileupload';
import session from 'express-session';
import store from 'memorystore';
import db from './src/persistence/db.js';
import generic from './src/product-pages/generic.js';
import blog from './src/product-pages/blog.js';
import genericAddressStripe from './src/product-pages/generic-address-stripe.js';
import genericRecoverStripe from './src/product-pages/generic-recover-stripe.js';
import genericMenuStripe from './src/product-pages/generic-menu-stripe.js';
import ebookDownload from './src/product-pages/ebook-download.js';
import gateway from 'magic-gateway-js';
import addie from 'addie-js';
import sessionless from 'sessionless-node';
import fs from 'fs';
import path from 'path';
import { signTeleportTags, getOrCreateKeys } from './sign-teleport-tags.js';

const MemoryStore = store(session);

const allowedTimeDifference = process.env.ALLOWED_TIME_DIFFERENCE || 600000;

let keys = await db.getKeys();
console.log(keys);

// Use Sanora's main keys for teleportation consistency
console.log('🏷️ Setting up teleportation using main Sanora keys...');
let basePubKey = null;
try {
  // Use the main Sanora keys for teleportation to ensure consistency
  basePubKey = keys.pubKey;
  console.log('🔑 Base pubKey for clients:', basePubKey);
  
  // Configure the teleport signing to use the main keys instead
  console.log('✅ Teleportation configured with main keys');
} catch (error) {
  console.warn('⚠️ Failed to setup teleportation:', error.message);
}

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
addie.baseURL = process.env.LOCALHOST ? 'http://127.0.0.1:3005/' : `https://${SUBDOMAIN}.addie.allyabase.com/`;

let addieUser;

if(!keys) {
  addieUser = await addie.createUser(db.saveKeys, db.getKeys);

  keys = await db.getKeys();
  await sessionless.generateKeys(() => {}, db.getKeys);
  await db.putUser({pubKey: keys.pubKey, addieUser, basePubKey});
} else {
  try {
    addieUser = await db.getUserByPublicKey(keys.pubKey);
  } catch(err) {
console.warn(err);
    addieUser = await addie.createUser(db.saveKeys, db.getKeys);
console.log('updated addie user is: ', addieUser);
    await sessionless.generateKeys(() => {}, db.getKeys);
    await db.putUser({pubKey: keys.pubKey, addieUser, basePubKey});
  }
}

// Update existing user with basePubKey (always update to ensure consistency)
if (addieUser && keys && basePubKey) {
  try {
    const existingUser = await db.getUserByPublicKey(keys.pubKey);
    if (existingUser) {
      // Always update basePubKey to ensure consistency with teleport keys
      existingUser.basePubKey = basePubKey;
      await db.saveUser(existingUser);
      console.log('✅ Updated existing user with current basePubKey:', basePubKey);
    }
  } catch (error) {
    console.warn('⚠️ Failed to update existing user with basePubKey:', error.message);
  }
}

const app = express();

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
console.log("received request");
console.log(req.url);
//console.log(req.body);
console.log(req.headers);
  next();
});

app.use((req, res, next) => {
  const requestTime = +req.query.timestamp || +req.body.timestamp;
  const now = new Date().getTime();
  if(Math.abs(now - requestTime) > allowedTimeDifference) {
    return res.send({error: 'no time like the present'});
  }
  next();
});

app.use((req, res, next) => {
  console.log('\n\n', req.body, '\n\n');
  next();
});

app.put('/user/create', async (req, res) => {
  try {
    const pubKey = req.body.pubKey;
    const message = req.body.timestamp +  pubKey;
    const signature = req.body.signature;

    if(!signature || !sessionless.verifySignature(signature, message, pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const resp = await fetch(`${addie.baseURL}user/create`, {
      method: 'put',
      body: JSON.stringify(req.body),
      headers: {'Content-Type': 'application/json'}
    });
 
    const newAddieUser = await resp.json();

    const foundUser = await db.putUser({ pubKey, addieUser: newAddieUser, basePubKey });
    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(req.params.uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    // Add basePubKey to user if it's missing (for backwards compatibility)
    if (!foundUser.basePubKey && basePubKey) {
      foundUser.basePubKey = basePubKey;
      // Save the updated user back to database
      await db.saveUser(foundUser);
    }

    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/processor/:processor', async (req, res) => {
  try {
    const foundUser = await db.getUserByUUID(req.params.uuid);
    const resp = await fetch(`${addie.baseURL}user/${foundUser.addieUser.uuid}/processor/${req.params.processor}`, {
      method: 'put',
      body: JSON.stringify(req.body),
      headers: {'Content-Type': 'application/json'}
    });

    const json = await resp.json();
    res.send(json);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/product/:title', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const title = req.params.title;
    const description = req.body.description;
    const price = req.body.price;
    const timestamp = req.body.timestamp;
    const signature = req.body.signature;
console.log('title', title);

    const message = timestamp + uuid + title + description + price;

    const foundUser = await db.getUserByUUID(uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const product = await db.putProduct(foundUser, {title, ...req.body, artifacts: []});
    res.send(product);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/product/:title/image', async (req, res) => {
  try {
    if(!req.files) {
      res.send({error: 'no image'});
    } else {
      const timestamp = req.headers['x-pn-timestamp'];
      const signature = req.headers['x-pn-signature'];
      const uuid = req.params.uuid;
      const title = req.params.title;

      const product = await db.getProduct(uuid, title);

      if(!product) {
        res.status(404);
        return res.send({error: 'not found'});
      }

      const message = timestamp + uuid + title;

      const foundUser = await db.getUserByUUID(uuid);

      if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
        res.status(403);
        return res.send({error: 'auth error'});
      }

      const image = req.files.image;
      const imageUUID = sessionless.generateUUID();
      await image.mv('./images/' + imageUUID);

      product.image = imageUUID;
   
      db.putProduct(foundUser, product);

      res.send({success: true});
    }
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/product/:title/artifact', async (req, res) => {
  try {
    if(!req.files) {
      res.send({error: 'no image'});
    } else {
      const artifactType = req.headers['x-pn-artifact-type'];
      const timestamp = req.headers['x-pn-timestamp'];
      const signature = req.headers['x-pn-signature'];
      const uuid = req.params.uuid;
      const title = req.params.title;

      const product = await db.getProduct(uuid, title);

      if(!product) {
        res.status(404);
        return res.send({error: 'not found'});
      }

      const message = timestamp + uuid + title;

      const foundUser = await db.getUserByUUID(uuid);

      if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
        res.status(403);
        return res.send({error: 'auth error'});
      }

      const artifact = req.files.artifact;
      const artifactUUID = sessionless.generateUUID();
      const extension = path.extname(artifact.name);
      const artifactName = artifactUUID + extension;
      await artifact.mv('./artifacts/' + artifactName);

      product.artifacts.push(artifactName);

      db.putProduct(foundUser, product);

      res.send({success: true});
    }
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/products/:uuid/:title', async (req, res) => {
  try {
    const product = await db.getProduct(req.params.uuid, req.params.title);
    res.send(product);    
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/products/base', async (req, res) => {
  try {
    const products = await db.getProductsForBase();
    res.send(products);    
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/products/:uuid', async (req, res) => {
  try {
    const products = await db.getProducts(req.params.uuid);
    res.send(products);    
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.use(session({ 
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  secret: 'seize the means of production!!!', 
  cookie: { maxAge: 60000000 }
}));

app.get('/products/:uuid/:title/:type', async (req, res) => {
   try {
    const host = req.get('host');
    if(!req.session.uuid) {
      req.session.regenerate((err) => {
console.warn(err);
console.log('session', req.session);
      });

      let keys;
      const newAddieUUID = await addie.createUser(newKeys => keys = newKeys, () => keys);

      const newAddieUser = {
        uuid: newAddieUUID,
        keys
      };
console.log(newAddieUser);

      const user = {
	 ...newAddieUser,
	 pubKey: keys.pubKey     
      };
      req.session.uuid = user.uuid;

      await db.saveUser(user);
    }

    const product = await db.getProduct(req.params.uuid, req.params.title);
    product.content = './artifacts/' + product.artifacts[0];

    let html = "<div>not found</div>";
    switch(req.params.type) {
      case 'blog': html = await blog.htmlForProduct(product);
      break;
      case 'generic-recover-stripe': html = await genericRecoverStripe.htmlForProduct(host, product);
      break;
      case 'generic-menu-stripe': html = await genericMenuStripe.htmlForProduct(product);
      break;
      case 'ebook-download': 
      if(req.session.productId === product.productId) {
        html = await ebookDownload.htmlForProduct(host, product);
      }
      break;
      case 'generic-address-stripe': html = await genericAddressStripe.htmlForProduct(host, product);
      break;
      default: html = await generic.htmlForProduct(product);
      break;
    }

    res.send(html);    
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  } 
});

app.put('/processor/stripe/intent', async (req, res) => {
  try {
    const body = req.body;
    const timestamp = body.timestamp;
    const amount = body.amount;
    const currency = body.currency;

    if(!req.session || !req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }
console.log('intent session uuid is: ', req.session.uuid);

    const foundUser = await db.getUserByUUID(req.session.uuid);
    if(!foundUser || !foundUser.keys || foundUser.uuid !== req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const uuid = req.session.uuid;
    const message = timestamp + req.session.uuid + amount + currency;

    sessionless.getKeys = () => foundUser.keys;

    const signature = await sessionless.sign(message);

    sessionless.getKeys = db.getKeys;

    const payload = {
      timestamp,
      amount,
      uuid, 
      currency,
      signature
    };
console.log('sending this to addie', payload);

    const processor = 'stripe';
    const url = `${addie.baseURL}user/${uuid}/processor/${processor}/intent-without-splits`;
    const resp = await fetch(url, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    });
    const intent = await resp.json();

    res.send(intent);
  } catch(err) {
console.warn(err);
    res.status(404); 
    res.send({error: 'not found'});
  }
});

app.put('/processor/square/intent', async (req, res) => {
  try {
    const body = req.body;
    const timestamp = body.timestamp;
    const amount = body.amount;
    const currency = body.currency;
    const nonce = body.sourceId;

    if(!req.session || !req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }
console.log('intent session uuid is: ', req.session.uuid);

    const foundUser = await db.getUserByUUID(req.session.uuid);
    if(!foundUser || !foundUser.keys || foundUser.uuid !== req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const uuid = req.session.uuid;
    const message = timestamp + req.session.uuid + amount + currency;

    sessionless.getKeys = () => foundUser.keys;

    const signature = await sessionless.sign(message);

    sessionless.getKeys = db.getKeys;

    const payload = {
      timestamp,
      amount,
      uuid, 
      currency,
      nonce,
      signature
    };
console.log('sending this to addie', payload);

    const processor = 'stripe';
    const url = `${addie.baseURL}user/${uuid}/processor/${processor}/intent-without-splits`;
    const resp = await fetch(url, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    });
    const intent = await resp.json();

    res.send(intent);
  } catch(err) {
console.warn(err);
    res.status(404); 
    res.send({error: 'not found'});
  }
});

app.get('/images/:imageUUID', async (req, res) => {
  res.sendFile(path.resolve('.', `images/${req.params.imageUUID}`));
});

app.put('/user/:uuid/orders', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const timestamp = req.body.timestamp;
    const order = req.body.order;
    const signature = req.body.signature;
    
    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    // TODO: There needs to be some step here that verifies that payment has settled
    // TODO: Needs to have a permission nineum for being able to update orders
    const orderUser = await db.getUserByUUID(order.userUUID);

    await db.updateOrder(orderUser, order);

    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/orders', async (req, res) => {
  try {
    const timestamp = req.body.timestamp;
    const order = req.body.order;

    if(!req.session || !req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }
console.log('intent session uuid is: ', req.session.uuid);

    const foundUser = await db.getUserByUUID(req.session.uuid);
    if(!foundUser || !foundUser.keys || foundUser.uuid !== req.session.uuid) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const uuid = req.session.uuid;

    const message = timestamp + uuid;

    sessionless.getKeys = () => foundUser.keys;

    const signature = await sessionless.sign(message);

    sessionless.getKeys = db.getKeys;

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    // TODO: There needs to be some step here that verifies that payment has settled
    order.userUUID = uuid;

    await db.putOrder(foundUser, order);

    res.send(foundUser);
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/:uuid/orders/:productId', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const productId = req.params.productId;
    const timestamp = req.query.timestamp;
    const signature = req.query.signature;

    const message = timestamp + uuid;

    const foundUser = await db.getUserByUUID(uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    // TODO: add in the filtering for orders
    const orders = await db.getOrdersForProduct(productId);

    res.send({orders});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/create-hash/:hash/product/:productId', async (req, res) => {
  try {
    const uuid = req.session.uuid;
    const hash = req.params.hash;
    const productId = req.params.productId;
    const timestamp = new Date().getTime() + '';

    const foundUser = await db.getUserByUUID(uuid);
    const pubKey = foundUser.pubKey;

    const message = timestamp + hash + pubKey;
console.log('sanora signing', message);
console.log('foundUser looks like: ', foundUser);

    sessionless.getKeys = () => foundUser.keys;
    
    const signature = await sessionless.sign(message);
    
    sessionless.getKeys = db.getKeys;

    // This needs to be dynamic, but for now we'll assume a local joan
    const resp = await fetch(`http://127.0.0.1:3004/user/create`, {
      method: 'PUT',
      body: JSON.stringify({timestamp, hash, pubKey, signature}),
      headers: {"Content-Type": "application/json"}
    });
    const json = await resp.json();
console.log('create hash', json);
    if(json && json.uuid) {
      req.session.productId = productId;
      return res.send({success: true});
    }
    res.send({success: false});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/user/check-hash/:hash/product/:productId', async (req, res) => {
  try {
    const uuid = req.session.uuid;
    const hash = req.params.hash;
    const productId = req.params.productId;
    const timestamp = new Date().getTime() + '';

    const foundUser = await db.getUserByUUID(uuid);

    const message = timestamp + hash + foundUser.pubKey;

    sessionless.getKeys = () => foundUser.keys;
    
    const signature = await sessionless.sign(message);
    
    sessionless.getKeys = db.getKeys;

    // This needs to be dynamic, but for now we'll assume a local joan
    const resp = await fetch(`http://127.0.0.1:3004/user/${hash}/pubKey/${foundUser.pubKey}?timestamp=${timestamp}&signature=${signature}`);
    const json = await resp.json();
console.log('check hash', json);
    if(json && json.uuid) {
      req.session.productId = productId;
      return res.send({success: true});
    }
    res.send({success: false});
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.get('/images/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  const imagePath = path.join(process.cwd(), 'images', uuid);

  if(!fs.existsSync(imagePath)) {
    return res.status(404).send('Not found');
  }

  res.sendFile(imagePath);
});

app.get('/artifacts/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  const artifactPath = path.join(process.cwd(), 'artifacts', uuid);

  if(!fs.existsSync(artifactPath)) {
    return res.status(404).send('Not found');
  }
  
  const stats = fs.statSync(artifactPath);
  console.log('File size:', stats.size, 'bytes');

  res.sendFile(artifactPath);
}); 

// Serve form widget JavaScript
app.get('/form-widget.js', (req, res) => {
  const widgetCode = fs.readFileSync(path.join(process.cwd(), 'sanora/public/form-widget.js'), 'utf8');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(widgetCode);
});

// Serve form widget CSS
app.get('/form-widget.css', (req, res) => {
  const widgetCSS = fs.readFileSync(path.join(process.cwd(), 'sanora/public/form-widget.css'), 'utf8');
  res.setHeader('Content-Type', 'text/css');
  res.send(widgetCSS);
});

app.get('/form-demo.html', (req, res) => {
  const demoHTML = fs.readFileSync(path.join(process.cwd(), 'sanora/public/form-demo.html'), 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(demoHTML);
});

app.get('/form-widget-docs.html', (req, res) => {
  const docsHTML = fs.readFileSync(path.join(process.cwd(), 'sanora/public/form-widget-docs.html'), 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(docsHTML);
});

app.get('/peaceloveandredistribution', (req, res) => {
  const htmlPath = path.join(process.cwd(), 'peaceloveandredistribution.html');
       console.log('htmlPath is ', htmlPath);
  if(!fs.existsSync(htmlPath)) {
    return res.status(404).send('Not found');
  }
 
  res.sendFile(htmlPath);
});

// Serve teleportable products page with layout options
app.get('/teleportable-products', async (req, res) => {
  const layout = req.query.layout || 'vertical-scrolling-stack';
  
  try {
    // Get all products from the base
    const products = await db.getProductsForBase();
    
    // Generate teleport signature
    let signature = '';
    let message = '';
    let pubKey = basePubKey || '';
    
    if (basePubKey) {
      try {
        const timestamp = Date.now().toString();
        message = `${timestamp}:planet-nine-marketplace-products:teleport`;
        // Use main Sanora keys for signing teleport tags
        signature = await sessionless.sign(message);
        pubKey = basePubKey;
      } catch (err) {
        console.warn('Failed to sign teleport tag:', err);
      }
    }
    
    // Generate the HTML with products embedded
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planet Nine Products - Teleportable Feed</title>
</head>
<body style="margin: 0; padding: 0;">
    <!-- Teleportable Product Feed with Embedded Products -->
    <teleport id="planet-nine-products" type="feed" category="marketplace" signature="${signature}" message="${message}" pubKey="${pubKey}">
        <feed-meta>
            <title>Planet Nine Marketplace</title>
            <description>Discover unique products from the Planet Nine ecosystem</description>
            <last-updated>${new Date().toISOString()}</last-updated>
            <source-url>${req.protocol}://${req.get('host')}/teleportable-products</source-url>
        </feed-meta>`;
    
    // Add each product as a teleportal within the teleport tag
    if (products && products.length > 0) {
      products.forEach(userProducts => {
        Object.values(userProducts).forEach(product => {
          const baseUrl = req.protocol + '://' + req.get('host');
          const price = product.price ? (product.price / 100).toFixed(2) : '0.00';
          
          html += `
        <teleportal id="${product.productId || 'product-' + Date.now()}" category="${product.category || 'general'}" price="${product.price || '0'}" currency="USD">
            <title>${product.title || 'Untitled Product'}</title>
            <description>${product.description || 'No description available'}</description>
            <url>${baseUrl}/products/${product.uuid}/${encodeURIComponent(product.title)}</url>
            <image>${product.image ? baseUrl + '/images/' + product.image : ''}</image>
            <tags>${product.tags || 'product,marketplace'}</tags>
            <in-stock>true</in-stock>
            <rating>${product.rating || '0'}</rating>
        </teleportal>`;
        });
      });
    }
    
    html += `
    </teleport>
    
    <!-- Visual Product Display with Inline Styles -->
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="text-align: center; margin-bottom: 30px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <h1 style="font-size: 2.5em; margin-bottom: 10px;">🌌 Planet Nine Products</h1>
            <p style="font-size: 1.1em; opacity: 0.95;">Teleportable Product Feed</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">`;
    
    // Add product cards with inline styles
    if (products && products.length > 0) {
      products.forEach(userProducts => {
        Object.values(userProducts).forEach(product => {
          const baseUrl = req.protocol + '://' + req.get('host');
          const price = product.price ? '$' + (product.price / 100).toFixed(2) : 'Free';
          
          html += `
            <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3em; ${product.image ? `background: url(${baseUrl}/images/${product.image}) center/cover;` : ''}">
                    ${!product.image ? '📦' : ''}
                </div>
                <div style="padding: 20px;">
                    <h3 style="font-size: 1.4em; margin: 0 0 10px 0; color: #2c3e50;">${product.title || 'Untitled Product'}</h3>
                    <p style="color: #7f8c8d; line-height: 1.5; margin: 0 0 15px 0;">${product.description || 'No description available'}</p>
                    <div style="font-size: 1.5em; font-weight: bold; color: #27ae60; margin-bottom: 15px;">${price}</div>
                    <a href="${baseUrl}/products/${product.uuid}/${encodeURIComponent(product.title)}" style="display: block; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 25px; font-size: 1em; font-weight: bold;">View Product</a>
                </div>
            </div>`;
        });
      });
    } else {
      html += `
            <div style="text-align: center; color: white; padding: 40px; font-size: 1.2em;">
                📦 No products available yet
            </div>`;
    }
    
    html += `
        </div>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('Error generating teleportable products:', error);
    res.status(500).send('Error generating product feed');
  }
});

app.listen(process.env.PORT || 7243);
console.log('Join the club');
