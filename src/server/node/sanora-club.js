import express from 'express';
import fileUpload from 'express-fileupload';
import db from './src/persistence/db.js';
import gateway from 'magic-gateway-js';
import addie from 'addie-js';
import sessionless from 'sessionless-node';
import fs from 'fs';
import path from 'path';

const allowedTimeDifference = process.env.ALLOWED_TIME_DIFFERENCE || 600000;

let keys = await db.getKeys();
console.log(keys);

const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
addie.baseURL = process.env.LOCALHOST ? 'http://127.0.0.1:3005/' : `https://${SUBDOMAIN}.addie.allyabase.com/`;

let addieUser;

if(!keys) {
  addieUser = await addie.createUser(db.saveKeys, db.getKeys);

  keys = await db.getKeys();
  await sessionless.generateKeys(() => {}, db.getKeys);
  await db.putUser({pubKey: keys.pubKey, addieUser});
} else {
  try {
    addieUser = await db.getUserByPublicKey(keys.pubKey);
  } catch(err) {
console.warn(err);
    addieUser = await addie.createUser(db.saveKeys, db.getKeys);
console.log('updated addie user is: ', addieUser);
    await sessionless.generateKeys(() => {}, db.getKeys);
    await db.putUser({pubKey: keys.pubKey, addieUser});
  }
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
 
    const newAddieUser = await resp.json();

    const foundUser = await db.putUser({ pubKey, addieUser: newAddieUser });
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
      await artifact.mv('./artifacts/' + artifactUUID);

      product.artifacts.push(artifactUUID);

      db.putProduct(foundUser, product);

      res.send({success: true});
    }
  } catch(err) {
console.warn(err);
    res.status(404);
    res.send({error: 'not found'});
  }
});

app.listen(process.env.PORT || 7243);
console.log('Join the club');
