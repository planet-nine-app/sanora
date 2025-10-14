import { should } from 'chai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superAgent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.sanora.allyabase.com/` : 'http://127.0.0.1:5121/';

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
let savedProduct = {};

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
  savedProduct = res.body;
  res.body.title.should.equal(title);
});

it('should put an artifact for the product', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My product';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/artifact`)
    .attach('artifact', join(__dirname, 'book.epub'))
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
    .attach('image', join(__dirname, 'image.png'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);

});

it('should get product', async () => {
  const res = await get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}`);
  res.body.title.should.equal('My product');
});

it('should get products', async () => {
  const res = await get(`${baseURL}products/${savedUser.uuid}`);
console.log('products body', res.body);
  res.body.should.equal('foo');
});

it('should get all products for the base', async () => {
  const res = await get(`${baseURL}products/base`);
console.log('products body', res.body);
  res.body.should.equal('foo');
});

it('should get product html', async () => {
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic`);
//console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('My product').should.not.equal(-1);
});

it('should get product html with address and stripe', async () => {
  console.log('getting product at this url: ', `${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic-address-stripe`);
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic-address-stripe`);
console.log('here is the address site', res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('My product').should.not.equal(-1);
});

it('should get product html for recover and stripe', async () => {
  console.log('getting product at this url: ', `${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic-recover-stripe`);
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My product')}/generic-recover-stripe`);
console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('My product').should.not.equal(-1);
});

it('should put an ebook', async () => {
  const title = 'My book';
  const payload = {
    timestamp: new Date().getTime() + '',
    description: 'Lorem ipsum book time baby!',
    price: 1000
  };

  const message = payload.timestamp + savedUser.uuid + title + payload.description + payload.price;
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}`, payload);
console.log('product meta,', res.body);
  res.body.title.should.equal(title);
});

it('should put an image for the ebook', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My book';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/image`)
    .attach('image', join(__dirname, 'image.png'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should put an artifact for the book', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My book';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/artifact`)
    .attach('artifact', join(__dirname, 'A Brief History of Teleportation.epub'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should get book html', async () => {
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My book')}/generic-recover-stripe`);
console.log('here is the resp from blog html', res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('My book').should.not.equal(-1);
});

it('should put a blog', async () => {
  const title = 'My blog';
  const payload = {
    timestamp: new Date().getTime() + '',
    description: 'Lorem ipsum blog time baby!',
    price: 1000
  };

  const message = payload.timestamp + savedUser.uuid + title + payload.description + payload.price;
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}`, payload);
console.log('product meta,', res.body);
  res.body.title.should.equal(title);
});

it('should put an artifact for the blog', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'My blog';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/artifact`)
    .attach('artifact', join(__dirname, 'sessionless.md'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should get blog html', async () => {
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('My blog')}/blog`);
console.log('here is the resp from blog html', res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('Sessionless').should.not.equal(-1);
});

it('should get payment intent', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    amount: 2000,
    currency: 'USD'
  };

  const res = await superAgent.put(`${baseURL}processor/stripe/intent`)
    .set('Cookie', savedUser['set-cookie'])
    .set('Content-Type', 'application/json')
    .send(payload);
  
  console.log(res.body);
});

it('should put order', async () => {
  const payload = {
    timestamp: new Date().getTime() + '',
    order: {
      productId: 'foo',
      foo: 'bar',
      baz: 'bop'
    }
  };

  const message = payload.timestamp + savedUser.uuid;

  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/orders`, payload);
console.log(res.body);

  res.body.uuid.should.equal(savedUser.uuid);
});

it('should get orders', async () => {
  const timestamp = new Date().getTime() + '';
  const message = timestamp + savedUser.uuid;
  const signature = await sessionless.sign(message);

  const res = await get(`${baseURL}user/${savedUser.uuid}/orders/foo?timestamp=${timestamp}&signature=${signature}`);
console.log('orders::::::::', res.body);

  res.body.orders.length.should.not.equal(0);
});

it('should create a recovery hash', async () => {
  savedUser.recoveryHash = 'foobarbaz';
  
  const res = await superAgent.get(`${baseURL}user/create-hash/${savedUser.recoveryHash}/product/${savedProduct.productId}`)
    .set('Cookie', savedUser['set-cookie']);
  res.body.success.should.equal(true);
});

it('should check a recovery hash', async () => {
  const res = await superAgent.get(`${baseURL}user/check-hash/${savedUser.recoveryHash}/product/${savedProduct.productId}`)
    .set('Cookie', savedUser['set-cookie']);
  res.body.success.should.equal(true);
});


