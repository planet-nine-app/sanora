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

      // 3. Create BDO with the product
      const timestamp = Date.now().toString();
      const hash = '';
      const keys = await db.getKeys();

      if (!keys || !keys.pubKey) {
        console.error('  ❌ Failed to get Sanora base keys for BDO creation');
        // Return success with product only, note BDO failure
        return {
          success: true,
          product,
          bdo: null,
          warning: 'Product created but BDO creation failed (no keys)'
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

      const messageToSign = timestamp + hash + keys.pubKey;
      const signature = await sessionless.sign(messageToSign);

      const bdoPayload = {
        timestamp,
        hash,
        pubKey: keys.pubKey,
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
            pubKey: keys.pubKey,
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
