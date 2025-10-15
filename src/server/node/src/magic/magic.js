import sessionless from 'sessionless-node';
import db from '../persistence/db.js';

sessionless.generateKeys(() => {}, db.getKeys);

const BDO_URL = process.env.BDO_URL || 'http://127.0.0.1:3003/';

const MAGIC = {
  /**
   * enchant-product - Create a Sanora product with an accompanying BDO
   *
   * This spell creates both a product in Sanora and a shareable BDO
   * with SVG content, allowing products to be easily discovered and
   * shared across the Planet Nine ecosystem.
   *
   * Cost: 200 MP
   *
   * Expected spell components:
   * - title: Product title
   * - description: Product description
   * - price: Price in cents
   * - tags: Array of product tags
   * - category: Product category
   * - contentType: Type of content (physical, digital, etc.)
   * - productId: Unique product identifier
   * - metadata: Additional product metadata (optional)
   * - svgContent: Custom SVG content for BDO (optional, auto-generated if not provided)
   */
  'enchant-product': async (spell) => {
    try {
      console.log('🪄 Sanora resolving enchant-product spell');

      const {
        title,
        description,
        price,
        tags,
        category,
        contentType,
        productId,
        metadata = {},
        svgContent
      } = spell.components;

      // Validate required components
      if (!title || price === undefined || !productId) {
        return {
          success: false,
          error: 'Missing required spell components: title, price, productId'
        };
      }

      // Get the user casting the spell
      const user = await db.getUserByUUID(spell.casterUUID);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // 1. Create the product in Sanora
      const productData = {
        title,
        description: description || '',
        price,
        tags: tags || [],
        category: category || 'general',
        contentType: contentType || 'physical',
        productId,
        metadata,
        artifacts: []
      };

      const product = await db.putProduct(user, productData);
      console.log(`  ✅ Product created: ${title}`);

      // 2. Generate or use provided SVG content for BDO
      const svg = svgContent || generateProductSVG({
        title,
        price,
        productId,
        category
      });

      // 3. Create BDO with the product - generate unique keys for each companion BDO
      const timestamp = Date.now().toString();
      const hash = '';

      // Generate NEW keys for this specific companion BDO (not Sanora base keys!)
      const companionKeys = await sessionless.generateKeys(
        (keys) => {}, // saveKeys - noop for companion BDOs
        () => null     // getKeys - noop for companion BDOs
      );

      if (!companionKeys || !companionKeys.pubKey) {
        console.error('  ❌ Failed to generate companion BDO keys');
        // Return success with product only, note BDO failure
        return {
          success: true,
          product,
          bdo: null,
          warning: 'Product created but BDO creation failed (key generation failed)'
        };
      }

      const bdoData = {
        title: `${title} - Product BDO`,
        type: 'product',
        productId,
        price,
        svgContent: svg,
        category,
        contentType,
        metadata: {
          ...metadata,
          sanoraUUID: user.uuid,
          productTitle: title,
          priceFormatted: `$${(price / 100).toFixed(2)}`,
          createdViaSpell: true,
          spellCaster: spell.casterUUID
        },
        description: description || `Product listing for ${title}`
      };

      const messageToSign = timestamp + hash + companionKeys.pubKey;

      // Sign with the companion keys
      const savedCurrentKeys = sessionless.getKeys();
      sessionless.saveKeys(companionKeys); // Temporarily set companion keys for signing
      const signature = await sessionless.sign(messageToSign);
      if (savedCurrentKeys) {
        sessionless.saveKeys(savedCurrentKeys); // Restore original keys
      }

      const bdoPayload = {
        timestamp,
        hash,
        pubKey: companionKeys.pubKey,
        signature,
        public: true,
        bdo: bdoData
      };

      try {
        const bdoResponse = await fetch(`${BDO_URL}user/create`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bdoPayload)
        });

        if (!bdoResponse.ok) {
          const error = await bdoResponse.text();
          console.error('  ❌ BDO creation failed:', error);
          return {
            success: true,
            product,
            bdo: null,
            warning: `Product created but BDO creation failed: ${error}`
          };
        }

        const bdoResult = await bdoResponse.json();
        console.log(`  ✅ BDO created for product`);
        console.log(`     Emoji shortcode: ${bdoResult.emojiShortcode || 'pending'}`);

        return {
          success: true,
          product: {
            uuid: user.uuid,
            title: product.title,
            productId: product.productId,
            price: product.price
          },
          bdo: {
            uuid: bdoResult.uuid,
            pubKey: companionKeys.pubKey,
            emojiShortcode: bdoResult.emojiShortcode
          },
          message: 'Product and BDO created successfully'
        };

      } catch (error) {
        console.error('  ❌ BDO creation request failed:', error);
        return {
          success: true,
          product,
          bdo: null,
          warning: `Product created but BDO creation failed: ${error.message}`
        };
      }

    } catch (error) {
      console.error('❌ enchant-product spell failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 🪄 MAGIC-ROUTED ENDPOINTS (No auth needed - resolver authorizes)

  sanoraUserCreate: async (spell) => {
    try {
      const { pubKey } = spell.components;

      if (!pubKey) {
        return {
          success: false,
          error: 'Missing required field: pubKey'
        };
      }

      // Get basePubKey from db
      const keys = await db.getKeys();
      const basePubKey = keys ? keys.pubKey : null;

      // Create addie user
      const addieModule = await import('addie-js');
      const addie = addieModule.default;
      const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
      addie.baseURL = process.env.LOCALHOST ? 'http://127.0.0.1:3005/' : `https://${SUBDOMAIN}.addie.allyabase.com/`;

      const timestamp = Date.now().toString();
      const message = timestamp + pubKey;

      // We need to sign with the caster's keys for addie
      // But for now, let's just forward the request
      const resp = await fetch(`${addie.baseURL}user/create`, {
        method: 'put',
        body: JSON.stringify({ timestamp, pubKey, signature: spell.casterSignature }),
        headers: {'Content-Type': 'application/json'}
      });

      const newAddieUser = await resp.json();
      const foundUser = await db.putUser({ pubKey, addieUser: newAddieUser, basePubKey });

      return {
        success: true,
        user: foundUser
      };
    } catch (err) {
      console.error('sanoraUserCreate error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  sanoraUserProcessor: async (spell) => {
    try {
      const { uuid, processor } = spell.components;

      if (!uuid || !processor) {
        return {
          success: false,
          error: 'Missing required fields: uuid, processor'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const addieModule = await import('addie-js');
      const addie = addieModule.default;
      const SUBDOMAIN = process.env.SUBDOMAIN || 'dev';
      addie.baseURL = process.env.LOCALHOST ? 'http://127.0.0.1:3005/' : `https://${SUBDOMAIN}.addie.allyabase.com/`;

      const resp = await fetch(`${addie.baseURL}user/${foundUser.addieUser.uuid}/processor/${processor}`, {
        method: 'put',
        body: JSON.stringify(spell.components),
        headers: {'Content-Type': 'application/json'}
      });

      const json = await resp.json();

      return {
        success: true,
        result: json
      };
    } catch (err) {
      console.error('sanoraUserProcessor error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  sanoraUserProduct: async (spell) => {
    try {
      const { uuid, title, description, price } = spell.components;

      if (!uuid || !title || !description || price === undefined) {
        return {
          success: false,
          error: 'Missing required fields: uuid, title, description, price'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const product = await db.putProduct(foundUser, {
        title,
        description,
        price,
        artifacts: [],
        ...spell.components
      });

      return {
        success: true,
        product
      };
    } catch (err) {
      console.error('sanoraUserProduct error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  sanoraUserProductImage: async (spell) => {
    try {
      const { uuid, title, imageData, imageExtension } = spell.components;

      if (!uuid || !title || !imageData) {
        return {
          success: false,
          error: 'Missing required fields: uuid, title, imageData'
        };
      }

      const product = await db.getProduct(uuid, title);
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate UUID for image
      const imageUUID = sessionless.generateUUID();

      // Decode base64 image data and save to file
      const fs = await import('fs');
      const imageBuffer = Buffer.from(imageData, 'base64');
      await fs.default.promises.writeFile(`./images/${imageUUID}`, imageBuffer);

      product.image = imageUUID;
      await db.putProduct(foundUser, product);

      return {
        success: true,
        imageUUID
      };
    } catch (err) {
      console.error('sanoraUserProductImage error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  sanoraUserProductArtifact: async (spell) => {
    try {
      const { uuid, title, artifactData, artifactType, artifactExtension } = spell.components;

      if (!uuid || !title || !artifactData) {
        return {
          success: false,
          error: 'Missing required fields: uuid, title, artifactData'
        };
      }

      const product = await db.getProduct(uuid, title);
      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate UUID for artifact
      const artifactUUID = sessionless.generateUUID();
      const extension = artifactExtension || '';
      const artifactName = artifactUUID + extension;

      // Decode base64 artifact data and save to file
      const fs = await import('fs');
      const artifactBuffer = Buffer.from(artifactData, 'base64');
      await fs.default.promises.writeFile(`./artifacts/${artifactName}`, artifactBuffer);

      product.artifacts.push(artifactName);
      await db.putProduct(foundUser, product);

      return {
        success: true,
        artifactName
      };
    } catch (err) {
      console.error('sanoraUserProductArtifact error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  sanoraUserOrders: async (spell) => {
    try {
      const { uuid, order } = spell.components;

      if (!uuid || !order) {
        return {
          success: false,
          error: 'Missing required fields: uuid, order'
        };
      }

      const foundUser = await db.getUserByUUID(uuid);
      if (!foundUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // TODO: There needs to be some step here that verifies that payment has settled
      const orderUser = await db.getUserByUUID(order.userUUID);
      if (!orderUser) {
        return {
          success: false,
          error: 'Order user not found'
        };
      }

      await db.updateOrder(orderUser, order);

      return {
        success: true,
        user: foundUser
      };
    } catch (err) {
      console.error('sanoraUserOrders error:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  gatewayForSpell: async (spellName) => {
    const keys = await db.getKeys();
    const user = await db.getUserByPublicKey(keys.pubKey);

    const gateway = {
      timestamp: Date.now().toString(),
      uuid: user.uuid,
      minimumCost: spellName === 'enchant-product' ? 200 : 20, // enchant-product costs 200 MP
      ordinal: user.ordinal || 0
    };

    const message = gateway.timestamp + gateway.uuid + gateway.minimumCost + gateway.ordinal;
    gateway.signature = await sessionless.sign(message);

    return gateway;
  },

  forwardSpell: async (spell, destination) => {
    return await fetch(destination, {
      method: 'POST',
      body: JSON.stringify(spell),
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Generate a simple SVG for a product BDO
 */
function generateProductSVG({ title, price, productId, category }) {
  const priceFormatted = `$${(price / 100).toFixed(2)}`;
  const categoryEmoji = getCategoryEmoji(category);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <style>
      .product-card { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .title { font-size: 32px; font-weight: 700; fill: white; }
      .price { font-size: 48px; font-weight: 700; fill: #4CAF50; }
      .category { font-size: 18px; fill: white; opacity: 0.9; }
      .emoji { font-size: 80px; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="800" height="400" fill="url(#bgGradient)"/>

  <!-- Category Emoji -->
  <text x="400" y="120" class="emoji" text-anchor="middle">${categoryEmoji}</text>

  <!-- Product Title -->
  <text x="400" y="180" class="title" text-anchor="middle">${truncateTitle(title, 40)}</text>

  <!-- Category -->
  <text x="400" y="210" class="category" text-anchor="middle">${category}</text>

  <!-- Price -->
  <text x="400" y="280" class="price" text-anchor="middle">${priceFormatted}</text>

  <!-- Product ID -->
  <text x="400" y="320" class="category" text-anchor="middle" font-size="14">ID: ${productId}</text>

  <!-- Footer -->
  <text x="400" y="370" class="category" text-anchor="middle" font-size="16">🌌 Powered by Planet Nine</text>
</svg>`;
}

/**
 * Get emoji for product category
 */
function getCategoryEmoji(category) {
  const emojiMap = {
    'apparel': '👕',
    'template': '📋',
    'toolkit': '🛠️',
    'ebook': '📚',
    'framework': '🏗️',
    'workshop': '🎓',
    'blog': '📝',
    'rental': '🏠',
    'physical': '📦',
    'digital': '💻',
    'service': '⚙️'
  };
  return emojiMap[category] || '🎁';
}

/**
 * Truncate title to fit in SVG
 */
function truncateTitle(title, maxLength) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

export default MAGIC;
