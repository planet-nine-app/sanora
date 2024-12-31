import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const baseURL = 'http://127.0.0.1:7243/';

const get = async function(path) {
  console.info("Getting " + path);
  return await superAgent.get(path).set('Content-Type', 'application/json');
};

const put = async function(path, body) {
  console.info("Putting " + path);
  return await superAgent.put(path).send(body).set('Content-Type', 'application/json');
};

const post = async function(path, body) {
  console.info("Posting " + path);
console.log(body);
  return await superAgent.post(path).send(body).set('Content-Type', 'application/json');
};

const _delete = async function(path, body) {
  //console.info("deleting " + path);
  return await superAgent.delete(path).send(body).set('Content-Type', 'application/json');
};

let savedUser = {};
let keys = {};
let keysToReturn = {};

it('should register a user', async () => {
  keys = await sessionless.generateKeys((k) => { keysToReturn = k; }, () => {return keysToReturn;});
/*  keys = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };*/
  const payload = {
    timestamp: new Date().getTime() + '',
    pubKey: keys.pubKey,
  };

  payload.signature = await sessionless.sign(payload.timestamp + payload.pubKey);

  const res = await put(`${baseURL}user/create`, payload);
console.log(res.body);
  savedUser = res.body;
  res.body.uuid.length.should.equal(36);
});

/*it('should put an account to a processor', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    name: "Foo",
    email: "zach+" + (Math.floor(Math.random() * 100000)) + "@planetnine.app"
  };

  const message = payload.timestamp + savedUser.addieUser.uuid + payload.name + payload.email;

  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/processor/stripe`, payload);
  savedUser = res.body;
console.log('stripe account id', savedUser.stripeAccountId);
  savedUser.stripeAccountId.should.not.equal(null);
}).timeout(60000);*/

it('should get user with account id', async () => {
  const timestamp = new Date().getTime() + '';

  const signature = await sessionless.sign(timestamp + savedUser.uuid);

  const res = await get(`${baseURL}user/${savedUser.uuid}?timestamp=${timestamp}&signature=${signature}`);
  res.body.addieUser.uuid.should.equal(savedUser.addieUser.uuid);
  savedUser = res.body;
});

it('should put a product', async () => {
  const title = 'My product';
  const payload = {
    timestamp: new Date().getTime() + '',
    description: 'Lorem ipsum heyoooooo',
    price: 1000
  };

  const message = payload.timestamp + savedUser.uuid + title + payload.description + payload.price;
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}`, payload);
console.log('product meta,', res.body);
  res.body.title.should.equal(title);
});

it('should put an artifact for the product', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My product';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/artifact`)
    .attach('artifact', './book.epub')
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should put an image for the product', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My product';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/image`)
    .attach('image', './image.png')
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);

});

it('should get product', async () => {
  const res = await get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}`);
  res.body.title.should.equal('My product');
});

it('should get product html', async () => {
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic`);
console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('My product').should.not.equal(-1);
});

it('should get payment intent', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    amount: 2000,
    currency: 'USD'
  };

  const res = await superAgent.put(`${baseURL}processor/stripe/intent`)
    .set('Cookie', savedUser['set-cookie'])
    .set('Content-Type', 'application/json');
  
  console.log(res.body);
});

