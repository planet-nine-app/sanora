import { should } from 'chai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
should();
import sessionless from 'sessionless-node';
import superAgent from 'superagent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.sanora.allyabase.com/` : 'http://127.0.0.1:7243/';

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
  keys = keysToReturn = {
    privateKey: 'd6bfebeafa60e27114a40059a4fe82b3e7a1ddb3806cd5102691c3985d7fa591',
    pubKey: '03f60b3bf11552f5a0c7d6b52fcc415973d30b52ab1d74845f1b34ae8568a47b5f'
  };
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

it('should put a product', async () => {
  const title = 'I Go To Eleven Toddler Tee';
  const payload = {
    timestamp: new Date().getTime() + '',
    description: 'Lorem ipsum heyoooooo',
    price: 1800
  };

  const message = payload.timestamp + savedUser.uuid + title + payload.description + payload.price;
  payload.signature = await sessionless.sign(message);

  const res = await put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}`, payload);
console.log('product meta,', res.body);
  res.body.title.should.equal(title);
});

it('should put an image for the product', async () => {
  const timestamp = new Date().getTime() + '';
  const title = 'I Go To Eleven Toddler Tee';

  const message = timestamp + savedUser.uuid + title;
  const signature = await sessionless.sign(message);

  const res = await superAgent.put(`${baseURL}user/${savedUser.uuid}/product/${encodeURIComponent(title)}/image`)
    .attach('image', join(__dirname, 'igotoeleven.png'))
    .set('x-pn-timestamp', timestamp)
    .set('x-pn-signature', signature);

  res.body.success.should.equal(true);
});

it('should get product', async () => {
  const res = await get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('I Go To Eleven Toddler Tee')}`);
  res.body.title.should.equal('I Go To Eleven Toddler Tee');
});

it('should get products', async () => {
  const res = await get(`${baseURL}products/${savedUser.uuid}`);
console.log('products body', res.body);
  res.body.should.equal('foo');
});

it('should get product html', async () => {
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('I Go To Eleven Toddler Tee')}/generic`);
//console.log(res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('I Go To Eleven Toddler Tee').should.not.equal(-1);
});

it('should get product html with address and stripe', async () => {
  console.log('getting product at this url: ', `${baseURL}products/${savedUser.uuid}/${encodeURIComponent('I Go To Eleven Toddler Tee')}/generic-address-stripe`);
  const res = await superAgent.get(`${baseURL}products/${savedUser.uuid}/${encodeURIComponent('I Go To Eleven Toddler Tee')}/generic-address-stripe`);
console.log('here is the address site', res.text);
console.log('headers:', res.headers);
  savedUser['set-cookie'] = res.headers['set-cookie'];
  res.text.indexOf('I Go To Eleven Toddler Tee').should.not.equal(-1);
});


