import express from 'express';
import db from './src/persistence/db.js';
import gateway from 'magic-gateway-js';
import addie from 'addie-js';
import sessionless from 'sessionless-node';
import fs from 'fs';
import path from 'path';

let keys = await db.getKeys();

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';

let addieUser;

if(!keys) {
  addie.baseURL = process.env.LOCALHOST ? 'http://127.0.0.1:3005/' : `https://${SUBDOMAIN}.fount.allyabase.com/`;
  addieUser = await addie.createUser(db.saveKeys, db.getKeys);

  keys = await db.getKeys();
  await sessionless.generateKeys(() => {}, db.getKeys);
  await db.saveUser(keys.pubKey, addieUser);
} else {
  addieUser = await db.getUserByPublicKey(keys.pubKey);
}

const app = express();

app.use(fileUpload({
    createParentPath: true
}));

app.use(express.json());
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
 
    const addieUser = await resp.json();

    const foundUser = await user.putUser({ pubKey, addieUser });
    res.send(foundUser);
  } catch(err) {
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

    const foundUser = await user.getUserByUUID(req.params.uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    res.send(foundUser);
  } catch(err) {
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.put('/user/:uuid/processor/:processor', async (req, res) => {
  try {
    const resp = await fetch(`${addie.baseURL}user/${req.params.uuid}/processor/${req.params.processor}`, {
      method: 'put',
      body: JSON.stringify(req.body),
      headers: {'Content-Type': 'application/json'}
    });

    const json = await resp.json();
    res.send(json);
  } catch(err) {
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

    const message = timestamp + uuid + title + description + price;

    const foundUser = await db.getUser(uuid);

    if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
      res.status(403);
      return res.send({error: 'auth error'});
    }

    const product = await db.putProduct(foundUser, {title, ...req.body});
    res.send(product);
  } catch(err) {
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

      const foundUser = await db.getUser(uuid);

      if(!signature || !sessionless.verifySignature(signature, message, foundUser.pubKey)) {
        res.status(403);
        return res.send({error: 'auth error'});
      }

      const image = req.files.image;
      const imageUUID = sessionless.generateUUID();
      await image.mv('./images/' + imageUUID);

      
    }
  } catch(err) {
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.listen(process.env.PORT || 7243);
