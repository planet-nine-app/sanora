/**
 * Sanora JavaScript Client SDK
 *
 * Port of the Rust sanora-rs client for Node.js and browser environments.
 *
 * @example
 * import Sanora from 'sanora-js';
 * import sessionless from 'sessionless-node';
 *
 * const sanora = new Sanora('https://dev.sanora.allyabase.com', sessionless);
 * const user = await sanora.createUser();
 */

import fetch from 'node-fetch';

class Sanora {
  /**
   * Create a new Sanora client instance
   *
   * @param {string} baseURL - Base URL for Sanora service (e.g., 'https://dev.sanora.allyabase.com')
   * @param {object} sessionless - Sessionless instance for authentication
   */
  constructor(baseURL, sessionless) {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.sessionless = sessionless;
  }

  /**
   * HTTP GET helper
   * @private
   */
  async get(path) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GET ${path} failed: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * HTTP POST helper
   * @private
   */
  async post(path, payload) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`POST ${path} failed: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * HTTP PUT helper
   * @private
   */
  async put(path, payload) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PUT ${path} failed: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * HTTP DELETE helper
   * @private
   */
  async delete(path) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DELETE ${path} failed: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * Create a new Sanora user
   *
   * @returns {Promise<object>} Created user object with uuid, pubKey, addieUser
   *
   * @example
   * const user = await sanora.createUser();
   * console.log(user.uuid);
   */
  async createUser() {
    const keys = await this.sessionless.getKeys();
    if (!keys || !keys.pubKey) {
      throw new Error('No keys available. Generate keys first with sessionless.generateKeys()');
    }

    const timestamp = Date.now().toString();
    const message = timestamp + keys.pubKey;
    const signature = await this.sessionless.sign(message);

    const response = await this.put('/user/create', {
      timestamp,
      pubKey: keys.pubKey,
      signature
    });

    return response;
  }

  /**
   * Get user by UUID
   *
   * @param {string} uuid - User UUID
   * @returns {Promise<object>} User object
   *
   * @example
   * const user = await sanora.getUserByUuid('user-uuid-here');
   */
  async getUserByUuid(uuid) {
    const keys = await this.sessionless.getKeys();
    const timestamp = Date.now().toString();
    const message = timestamp + uuid;
    const signature = await this.sessionless.sign(message);

    return await this.get(`/user/${uuid}?timestamp=${timestamp}&signature=${signature}`);
  }

  /**
   * Add a payment processor account to a user
   *
   * @param {string} uuid - User UUID
   * @param {string} processor - Processor name (e.g., 'stripe')
   * @param {object} processorData - Processor-specific data
   * @returns {Promise<object>} Updated user object
   *
   * @example
   * const user = await sanora.addProcessorAccount(
   *   'user-uuid',
   *   'stripe',
   *   { accountId: 'acct_123' }
   * );
   */
  async addProcessorAccount(uuid, processor, processorData) {
    const keys = await this.sessionless.getKeys();
    const timestamp = Date.now().toString();
    const message = timestamp + uuid + processor;
    const signature = await this.sessionless.sign(message);

    return await this.put(`/user/${uuid}/processor/${processor}`, {
      timestamp,
      signature,
      ...processorData
    });
  }

  /**
   * Add a product
   *
   * @param {string} uuid - User UUID (product owner)
   * @param {object} product - Product data
   * @param {string} product.title - Product title
   * @param {string} product.description - Product description
   * @param {number} product.price - Price in cents
   * @param {string[]} product.tags - Product tags
   * @param {string} product.category - Product category
   * @param {string} product.contentType - Content type
   * @param {string} product.productId - Unique product ID
   * @param {object} product.metadata - Additional metadata
   * @returns {Promise<object>} Created product object
   *
   * @example
   * const product = await sanora.addProduct('user-uuid', {
   *   title: 'My Product',
   *   description: 'A great product',
   *   price: 2999,
   *   tags: ['tag1', 'tag2'],
   *   category: 'ebook',
   *   contentType: 'digital',
   *   productId: 'prod_123',
   *   metadata: { author: 'John Doe' }
   * });
   */
  async addProduct(uuid, product) {
    const keys = await this.sessionless.getKeys();
    const timestamp = Date.now().toString();
    const message = timestamp + uuid + product.title;
    const signature = await this.sessionless.sign(message);

    return await this.put(`/user/${uuid}/product/${encodeURIComponent(product.title)}`, {
      timestamp,
      signature,
      ...product
    });
  }

  /**
   * Add an order
   *
   * @param {string} uuid - User UUID (product owner)
   * @param {object} order - Order data
   * @param {string} order.userUUID - Buyer's UUID
   * @param {string} order.productId - Product ID
   * @param {number} order.price - Price paid in cents
   * @param {string} order.status - Order status
   * @returns {Promise<object>} Created order object
   *
   * @example
   * const order = await sanora.addOrder('seller-uuid', {
   *   userUUID: 'buyer-uuid',
   *   productId: 'prod_123',
   *   price: 2999,
   *   status: 'completed'
   * });
   */
  async addOrder(uuid, order) {
    const keys = await this.sessionless.getKeys();
    const timestamp = Date.now().toString();
    const message = timestamp + uuid + order.productId;
    const signature = await this.sessionless.sign(message);

    return await this.put(`/user/${uuid}/orders`, {
      timestamp,
      signature,
      order
    });
  }

  /**
   * Get orders for a specific product
   *
   * @param {string} uuid - User UUID (product owner)
   * @param {string} productId - Product ID
   * @returns {Promise<object[]>} Array of orders
   *
   * @example
   * const orders = await sanora.getOrdersForProductId('user-uuid', 'prod_123');
   */
  async getOrdersForProductId(uuid, productId) {
    const keys = await this.sessionless.getKeys();
    const timestamp = Date.now().toString();
    const message = timestamp + uuid + productId;
    const signature = await this.sessionless.sign(message);

    return await this.get(`/user/${uuid}/product/${productId}/orders?timestamp=${timestamp}&signature=${signature}`);
  }
}

export default Sanora;
