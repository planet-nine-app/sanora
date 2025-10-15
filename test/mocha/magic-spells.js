import { should } from 'chai';
should();
import sessionless from 'sessionless-node';
import fount from 'fount-js';

const baseURL = process.env.SUB_DOMAIN ? `https://${process.env.SUB_DOMAIN}.fount.allyabase.com/` : 'http://127.0.0.1:3006/';
fount.baseURL = baseURL;

let keys = {};
let fountUser = {};
let sanoraUser = {};
let productTitle = '';

describe('Sanora MAGIC Spell Tests', () => {

  before(async () => {
    // Generate keys for testing
    keys = await sessionless.generateKeys(() => { return keys; }, () => { return keys; });

    // Create fount user for spell casting
    fountUser = await fount.createUser(() => keys, () => keys);
    console.log('Created fount user:', fountUser.uuid);
  });

  it('should create user via sanoraUserCreate spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 0,
      components: {
        pubKey: keys.pubKey
      }
    };

    // Sign the spell
    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    // Cast the spell
    const result = await fount.castSpell('sanoraUserCreate', spell);

    console.log('sanoraUserCreate result:', result);

    result.should.have.property('success', true);
    result.should.have.property('user');
    result.user.should.have.property('pubKey', keys.pubKey);

    sanoraUser = result.user;
  });

  it('should create product via sanoraUserProduct spell', async () => {
    const timestamp = Date.now().toString();
    productTitle = 'Test Product ' + timestamp;

    const spell = {
      spell: 'sanoraUserProduct',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 1,
      components: {
        uuid: sanoraUser.uuid,
        title: productTitle,
        description: 'A test product created via MAGIC spell',
        price: 9999, // $99.99
        category: 'digital',
        tags: ['test', 'magic']
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProduct', spell);

    console.log('sanoraUserProduct result:', result);

    result.should.have.property('success', true);
    result.should.have.property('product');
    result.product.should.have.property('title', productTitle);
    result.product.should.have.property('price', 9999);
  });

  it('should upload product image via sanoraUserProductImage spell', async () => {
    const timestamp = Date.now().toString();

    // Create a simple 1x1 pixel PNG image in base64
    const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const spell = {
      spell: 'sanoraUserProductImage',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 2,
      components: {
        uuid: sanoraUser.uuid,
        title: productTitle,
        imageData: imageData,
        imageExtension: '.png'
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProductImage', spell);

    console.log('sanoraUserProductImage result:', result);

    result.should.have.property('success', true);
    result.should.have.property('imageUUID');
  });

  it('should set processor via sanoraUserProcessor spell', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserProcessor',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 3,
      components: {
        uuid: sanoraUser.uuid,
        processor: 'stripe'
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProcessor', spell);

    console.log('sanoraUserProcessor result:', result);

    result.should.have.property('success', true);
    result.should.have.property('result');
  });

  it('should fail to create user with missing pubKey', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserCreate',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 4,
      components: {
        // Missing pubKey
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserCreate', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to create product with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserProduct',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 5,
      components: {
        uuid: sanoraUser.uuid
        // Missing title, description, price
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProduct', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to upload image with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserProductImage',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 6,
      components: {
        uuid: sanoraUser.uuid,
        title: productTitle
        // Missing imageData
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProductImage', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to upload artifact with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserProductArtifact',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 7,
      components: {
        uuid: sanoraUser.uuid,
        title: productTitle
        // Missing artifactData
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProductArtifact', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to set processor with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserProcessor',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 8,
      components: {
        uuid: sanoraUser.uuid
        // Missing processor
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserProcessor', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

  it('should fail to update orders with missing fields', async () => {
    const timestamp = Date.now().toString();

    const spell = {
      spell: 'sanoraUserOrders',
      casterUUID: fountUser.uuid,
      timestamp,
      totalCost: 50,
      mp: true,
      ordinal: 9,
      components: {
        uuid: sanoraUser.uuid
        // Missing order
      }
    };

    const message = timestamp + spell.spell + spell.casterUUID + spell.totalCost + spell.mp + spell.ordinal;
    spell.casterSignature = await sessionless.sign(message);

    const result = await fount.castSpell('sanoraUserOrders', spell);

    result.should.have.property('success', false);
    result.should.have.property('error');
  });

});
