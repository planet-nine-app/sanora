# Sanora Club

Sanora Club is a miniservice for hosting products, and eventually hooking into spell paths.
The goal is to be so lightweight that people can create a product from a single curl.
And to have those products be shareable around cyberspace via teleportation.

## Overview

There are a plethora of web-based solutions for creating product pages, and taking payments.
Many of them are just fine if you don't mind handing over 15% or more of your sale to the platform. 
Of course you're paying for a bunch of features you're probably not going to use, and the marketing you have to do has nothing to do with this platform you're using.

Instead of making and maintaining a bunch of features, Sanora Club gives you the absolute minimum you need to host and sell a product online.
Then by leveraging the Planet Nine ecosystem, others can build features that you can add, ideally at a discount from those other platforms.
Or not, and you keep more loot. 

## The product layout and account

Sanora Club needs two things from you in order to work: a product, and a way to pay you.

### The product layout

A minimalist approach to product display is a title, description, price and image. 
Since that's really all we'll be providing, and you may want to provide a landing page for people who either don't have a MAGIC extension, or don't want to purchase right away, there's also an optional redirect url.

And that's it.
Five things:

* title
* description
* price 
* image
* redirect url (optional)

### The account

We're gonna start with Stripe to begin with. 
You attach your stripe to your Sanora account, and then get paid when people buy your product. 

Stripe has all sorts of drop-in uis for this that we'll use, but you can do it via the command line too.

## API

So you create a user with your public key. 
And then you can start putting products.

<details>
 <summary><code>PUT</code> <code><b>/user/create</b></code> <code>Creates a new user if pubKey does not exist, and returns existing uuid if it does.</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | pubKey       |  true     | string (hex)            | the publicKey of the user's keypair  |
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

> ```javascript
>  curl -X PUT -H "Content-Type: application/json" -d '{"pubKey": "key", "timestamp": "now", "signature": "sig"}' https://<placeholderURL>/user/create
> ```

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/processor/:processor</b></code> <code>Creates an account token for a processor</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | name         |  true     | string                  | the user's name  |
> | email        |  true     | string                  | the user's email  |
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

> ```javascript
>  curl -X PUT -H "Content-Type: application/json" -d '{"name": "name", "email": "email@email.com", "timestamp": "now", "signature": "sig"}' https://<placeholderURL>/user/<uuid>/processor/<processor>
> ```

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/product/:title</b></code> <code>Creates or updates the product with the put title</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | title        |  true     | string                  | the title of the product  |
> | description  |  true     | string                  | the description of the product  |
> | price        |  true     | string                  | the price of the product  |
> | redirectURL  |  false    | string                  | an optional redirect url  |
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

> ```javascript
>  curl -X PUT -H "Content-Type: application/json" -d '{"pubKey": "key", "timestamp": "now", "signature": "sig"}' https://<placeholderURL>/user/create
> ```

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/product/:title/artifact</b></code> <code>Puts an image for the product with the given title</code></summary>

##### Headers

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | x-pn-artifact-type        |  true     | epub/pdf/md/etc | artifact type   |
> | x-pn-timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | x-pn-signature    |  true     | string (signature)      | the signature from sessionless for the message  |

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | artifact     |  true     | artifact type           | the artifact to upload   |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/product/:title/image/</b></code> <code>Puts an image for the product with the given title</code></summary>

##### Headers

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | x-pn-timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | x-pn-signature    |  true     | string (signature)      | the signature from sessionless for the message  |

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | image        |  true     | jpg/png                 | the image for the product   |
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>

<details>
 <summary><code>PUT</code> <code><b>/user/:uuid/orders</b></code> <code>Puts an image for the product with the given title</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | order        |  true     | string                  | the order object to store. Can contain any data you'd like
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>

<details>
 <summary><code>GET</code> <code><b>/user/:uuid/orders</b></code> <code>gets orders. Can take optional params for filtering orders</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | timestamp    |  true     | string                  | in a production system timestamps narrow window for replay attacks  |
> | pubKey       |  false    | string                  | get orders for a specific pubKey
> | product      |  false    | string                  | get orders of a specific product
> | signature    |  true     | string (signature)      | the signature from sessionless for the message  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `USER`   |
> | `400`         | `application/json`                | `{"code":"400","message":"Bad Request"}`                            |

##### Example cURL

TODO

</details>

<details>
 <summary><code>GET</code> <code><b>/products/base</b></code> <code>Gets all products available on this base server</code></summary>

##### Parameters

None required - this is a public endpoint that returns all products on the base.

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | `Array of product objects`   |
> | `404`         | `application/json`                | `{"error":"not found"}`                            |

##### Example cURL

> ```bash
>  curl -X GET https://dev.sanora.allyabase.com/products/base
> ```

##### Response Format

Returns an array of all product objects from all users on this base:

> ```json
> [
>   {
>     "title": "My Product",
>     "description": "Product description", 
>     "price": 1000,
>     "uuid": "user-uuid-here",
>     "productId": "product-id-here",
>     "timestamp": "2025-01-01T00:00:00Z"
>   }
> ]
> ```

</details>

<details>
 <summary><code>GET</code> <code><b>/teleportable-products</b></code> <code>Returns teleportable product feed for cross-base marketplace discovery via BDO teleportation</code></summary>

##### Parameters

None required - this endpoint dynamically generates teleportable content with all products from the base.

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `text/html`                       | HTML page with embedded teleportable product feed   |
> | `500`         | `text/plain`                      | `Error generating product feed`                            |

##### Example URLs

> ```bash
> # Get teleportable products
> https://dev.sanora.allyabase.com/teleportable-products
> ```

##### Teleportation Protocol Implementation

This endpoint generates a complete teleportable product feed that works with the Planet Nine teleportation system through BDO. The response includes:

1. **Teleport Tag with Signature**: A cryptographically signed `<teleport>` tag containing feed metadata
2. **Teleportal Elements**: Individual `<teleportal>` elements for each product with structured data
3. **Visual HTML Display**: Inline-styled product cards for direct viewing
4. **No JavaScript**: Pure HTML with inline CSS to ensure compatibility with teleportation

##### How Teleportation Works

The complete teleportation workflow involves three services working together:

1. **Sanora (Content Provider)**:
   - Generates teleportable HTML with signed `<teleport>` tags
   - Uses sessionless authentication to sign content with its base public key
   - Embeds products as `<teleportal>` elements with structured data
   - Stores the base public key (`basePubKey`) in user objects for client verification

2. **BDO (Teleportation Service)**:
   - Validates teleport signatures using the provided public key
   - Fetches content from remote URLs (supports `allyabase://` protocol for container networking)
   - Returns validated content with `valid: true` flag when signatures match
   - Handles cross-container communication in Docker environments

3. **Client Applications (e.g., Ninefy)**:
   - Request teleportation through BDO using the base's public key
   - Parse returned HTML to extract `<teleportal>` elements
   - Convert teleportal data into product objects for display
   - Show teleported content in dedicated UI sections

##### Teleport Tag Structure

```html
<teleport id="planet-nine-products" 
          type="feed" 
          category="marketplace" 
          signature="[sessionless_signature]" 
          message="[timestamp]:planet-nine-marketplace-products:teleport" 
          pubKey="[base_public_key]">
    <feed-meta>
        <title>Planet Nine Marketplace</title>
        <description>Discover unique products from the Planet Nine ecosystem</description>
        <last-updated>[ISO_timestamp]</last-updated>
        <source-url>[base_url]/teleportable-products</source-url>
    </feed-meta>
    
    <teleportal id="[product_id]" category="[category]" price="[cents]" currency="USD">
        <title>[Product Title]</title>
        <description>[Product Description]</description>
        <url>[product_url]</url>
        <image>[image_url]</image>
        <tags>[comma,separated,tags]</tags>
        <in-stock>true</in-stock>
        <rating>[0-5]</rating>
    </teleportal>
    <!-- More teleportal elements... -->
</teleport>
```

##### Container Networking with allyabase:// Protocol

For Docker container environments, the teleportation system supports the `allyabase://` protocol to handle container-to-container communication:

- **Client sends**: `allyabase://sanora/teleportable-products?pubKey=[key]`
- **BDO translates**: `allyabase://sanora` → `http://127.0.0.1:7243` (internal container port)
- **Enables**: Seamless teleportation across containerized services

##### Security & Authentication

- **Sessionless Signatures**: All teleport tags are signed using secp256k1 cryptographic keys
- **Public Key Verification**: BDO verifies signatures match the provided public key
- **Timestamp Protection**: Messages include timestamps to prevent replay attacks
- **Base Identity**: Each Sanora instance has a unique `basePubKey` for identification

##### Integration Example

```javascript
// Client-side teleportation request (from Ninefy)
const teleportUrl = `allyabase://sanora/teleportable-products?pubKey=${basePubKey}`;
const teleportedData = await bdoClient.teleport(uuid, hash, teleportUrl);

if (teleportedData.valid) {
  // Parse HTML and extract products
  const parser = new DOMParser();
  const doc = parser.parseFromString(teleportedData.html, 'text/html');
  const teleportals = doc.querySelectorAll('teleportal');
  
  // Convert to product objects
  const products = Array.from(teleportals).map(portal => ({
    id: portal.getAttribute('id'),
    title: portal.querySelector('title')?.textContent,
    price: parseInt(portal.getAttribute('price')),
    // ... more fields
  }));
}
```

##### Features

- **Dynamic Content Generation**: Products fetched from database and embedded in real-time
- **JavaScript-free Teleport Tags**: All styling uses inline CSS for maximum compatibility
- **Cross-Base Discovery**: Enables marketplace aggregation across Planet Nine network
- **Graceful Degradation**: Works even when some products lack complete data
- **Visual + Data**: Provides both human-readable display and machine-parseable data

</details>

## Form Widget System

Sanora includes a comprehensive SVG-based form widget system located in `/public/form-widget.js` that provides dynamic form generation for various field types. The widget is designed for creating product upload forms with validation and file handling capabilities.

### Supported Field Types

- **`text`** - Single-line text inputs with validation
- **`textarea`** - Multi-line text areas with character limits
- **`image`** - Image upload with preview and validation
- **`artifact`** - General file upload for digital goods (PDF, EPUB, ZIP, MP3, MP4, EXE, TXT, DOC)
- **`catalog`** - Specialized file upload for CSV/JSON catalog data *(Added January 2025)*
- **`datetime`** - Date and time picker widget

### Catalog Field Type (🆕 January 2025)

The **`catalog`** field type is specifically designed for hierarchical menu/catalog data upload:

**Features**:
- **File Restrictions**: Only accepts `.csv` and `.json` files
- **Size Limit**: 10MB maximum (smaller than artifact's 100MB)
- **Validation**: Strict MIME type checking for catalog data
- **Visual Feedback**: 🍽️ menu icon and catalog-specific messaging
- **Drag & Drop**: Full drag-and-drop support with visual feedback

**Usage in Form Config**:
```json
{
  "CSV or JSON File": {
    "type": "catalog"
  }
}
```

**Data Storage**: Catalog files are stored in `window.formCatalogData[fieldKey]` with file object, name, size, and type.

**Clear Function**: Global `clearCatalog(fieldKey)` function for removing uploaded catalogs.

### Integration with Menu System

The catalog field integrates with Ninefy's menu product type to:
1. **Upload CSV/JSON files** containing hierarchical menu structures
2. **Parse menu data** into tree structures (rider → time span → product)
3. **Upload individual products** to Sanora with price and metadata
4. **Map Sanora UUIDs** back to the menu tree structure
5. **Store complete menu** as public data in BDO for cross-base discovery

**Example CSV Format**:
```csv
,rider,time span,product,price
,adult,two-hour,adult two-hour 250,2.50
,adult,day,adult day 500,5.00
,youth,two-hour,youth two-hour 100,1.00
```

This creates a hierarchical menu system that enables complex product catalogs while maintaining Sanora's lightweight approach.

## MAGIC Protocol Integration

Sanora now supports the MAGIC protocol for creating products with associated BDOs (Base Data Objects) in a single action. This enables one-click product creation with automatic shareable BDO generation.

### Available Spells

#### `enchant-product` Spell

**Purpose**: Creates both a Sanora product AND a shareable BDO together in one action.

**Cost**: 200 MP (Mana Points)

**Location**: `/src/server/node/src/magic/magic.js`

**What it does**:
1. Creates a product in Sanora with full metadata
2. Auto-generates an SVG card for the product (or uses provided SVG)
3. Creates a public BDO with the product data and SVG
4. Returns both the product details and BDO emoji shortcode

**Spell Components**:
```javascript
{
  title: "Product Title",
  description: "Product description",
  price: 2999, // Price in cents
  tags: ["tag1", "tag2"],
  category: "general", // Product category
  contentType: "physical", // physical, digital, service, etc.
  productId: "unique-product-id",
  metadata: {}, // Optional metadata object
  svgContent: "..." // Optional SVG (auto-generated if not provided)
}
```

**Response Format**:
```javascript
{
  success: true,
  product: {
    uuid: "user-uuid",
    title: "Product Title",
    productId: "unique-product-id",
    price: 2999
  },
  bdo: {
    uuid: "bdo-uuid",
    pubKey: "02abc123...",
    emojiShortcode: "🌍🔑💎🌟💎🎨🐉📌"
  },
  message: "Product and BDO created successfully"
}
```

**MAGIC Endpoint**:
```http
POST /magic/spell/enchant-product
Content-Type: application/json

{
  "casterUUID": "user-uuid",
  "gateway": {
    "timestamp": "1234567890",
    "uuid": "user-uuid",
    "minimumCost": 200,
    "ordinal": 0,
    "signature": "spell-gateway-signature"
  },
  "components": {
    // spell components here
  }
}
```

### SVG Auto-Generation

When no `svgContent` is provided, the spell automatically generates a professional product card:

**Features**:
- Gradient background (Planet Nine purple)
- Category-specific emoji (📚 for ebooks, 🎓 for courses, etc.)
- Product title (truncated if needed)
- Category label
- Price display (formatted as $XX.XX)
- Product ID
- "Powered by Planet Nine" footer

**Generated SVG Structure**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <!-- Gradient background -->
  <!-- Category emoji (80px) -->
  <!-- Product title (32px, bold) -->
  <!-- Category label (18px) -->
  <!-- Price ($XX.XX in green, 48px) -->
  <!-- Product ID (14px) -->
  <!-- Footer (16px) -->
</svg>
```

### Integration Examples

**From Seed Script** (`/allyabase/deployment/docker/seed-ecosystem.js`):
```javascript
// Cast enchant-product spell to create product + BDO
const spell = {
  casterUUID: user.uuid,
  gateway: {
    timestamp: Date.now().toString(),
    uuid: user.uuid,
    signature: gatewaySignature,
    minimumCost: 200,
    ordinal: 0
  },
  components: {
    title: "My Product",
    description: "Product description",
    price: 2999,
    tags: ["tag1"],
    category: "general",
    contentType: "physical",
    productId: "my-product",
    metadata: {}
  }
};

const response = await fetch(`${sanoraUrl}/magic/spell/enchant-product`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(spell)
});

const result = await response.json();
// result contains both product and bdo with emoji shortcode
```

**From Ninefy** (`/the-nullary/ninefy/ninefy/src/main.js`):
Users can check a box "🪄 Also create BDO for sharing" when uploading products, which triggers the `castEnchantProductSpell()` function to use this spell instead of direct product upload.

### Benefits

1. **One-Click Creation**: Create both product and shareable BDO in single action
2. **Automatic SVG**: No need to design product cards manually
3. **Easy Sharing**: Get emoji shortcode instantly for cross-base sharing
4. **Cost 200 MP**: Affordable spell cost for creating shareable products
5. **Public by Default**: BDOs are public for maximum discoverability

### BDO Structure

Products created via `enchant-product` spell store in BDO with this structure:
```javascript
{
  title: "Product Title - Product BDO",
  type: "product",
  productId: "unique-product-id",
  price: 2999,
  svgContent: "<svg>...</svg>",
  category: "general",
  contentType: "physical",
  metadata: {
    sanoraUUID: "user-uuid",
    productTitle: "Product Title",
    priceFormatted: "29.99",
    createdViaSpell: true,
    spellCaster: "caster-uuid"
  },
  description: "Product description"
}
```

### Future Spells

Additional MAGIC spells planned for Sanora:
- `update-product` - Update existing product and BDO together
- `bundle-products` - Create product bundles with discounts
- `schedule-release` - Schedule product releases with automatic BDO creation

</details>