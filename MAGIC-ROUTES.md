# Sanora MAGIC-Routed Endpoints

## Overview

Sanora now supports MAGIC-routed versions of all POST, PUT, and DELETE operations. These spells route through Fount (the resolver) for centralized authentication. Sanora handles e-commerce operations, product management, payment processing, and order fulfillment for the Planet Nine ecosystem.

## Converted Routes

### 1. Create User
**Direct Route**: `PUT /user/create`
**MAGIC Spell**: `sanoraUserCreate`
**Cost**: 50 MP

**Components**:
```javascript
{
  pubKey: "user-public-key"
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    pubKey: "user-public-key",
    addieUser: {
      uuid: "addie-uuid",
      // ... addie user details
    },
    basePubKey: "base-public-key"
  }
}
```

**Validation**:
- Requires pubKey
- Creates corresponding Addie user for payment processing
- Sets basePubKey for teleportation support

---

### 2. Set Payment Processor
**Direct Route**: `PUT /user/:uuid/processor/:processor`
**MAGIC Spell**: `sanoraUserProcessor`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  processor: "stripe" // or "square", etc.
}
```

**Returns**:
```javascript
{
  success: true,
  result: {
    // Result from Addie processor configuration
  }
}
```

**Validation**:
- Requires uuid and processor
- User must exist
- Forwards to Addie for processor configuration

---

### 3. Create/Update Product
**Direct Route**: `PUT /user/:uuid/product/:title`
**MAGIC Spell**: `sanoraUserProduct`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  title: "Product Title",
  description: "Product description",
  price: 9999, // Price in cents ($99.99)
  category: "digital", // e.g., "physical", "digital", "service"
  tags: ["tag1", "tag2"],
  contentType: "ebook", // Optional: specific product type
  productId: "unique-product-id", // Optional: custom ID
  metadata: {} // Optional: additional metadata
}
```

**Returns**:
```javascript
{
  success: true,
  product: {
    title: "Product Title",
    description: "Product description",
    price: 9999,
    category: "digital",
    tags: ["tag1", "tag2"],
    artifacts: [],
    uuid: "user-uuid",
    productId: "generated-or-custom-id"
  }
}
```

**Validation**:
- Requires uuid, title, description, and price
- User must exist
- Creates product with empty artifacts array
- Accepts additional fields via spread operator

---

### 4. Upload Product Image
**Direct Route**: `PUT /user/:uuid/product/:title/image`
**MAGIC Spell**: `sanoraUserProductImage`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  title: "Product Title",
  imageData: "base64-encoded-image-data",
  imageExtension: ".png" // Optional: file extension
}
```

**Returns**:
```javascript
{
  success: true,
  imageUUID: "generated-image-uuid"
}
```

**Validation**:
- Requires uuid, title, and imageData
- Product must exist
- User must exist
- Decodes base64 image data and saves to `./images/` directory
- Generates UUID for image filename
- Updates product with image UUID

**Implementation Notes**:
- Image data must be base64 encoded for MAGIC spell transmission
- Supports any image format through extension parameter
- Original direct route accepts multipart file uploads
- MAGIC route uses base64 encoding for simplicity

---

### 5. Upload Product Artifact
**Direct Route**: `PUT /user/:uuid/product/:title/artifact`
**MAGIC Spell**: `sanoraUserProductArtifact`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  title: "Product Title",
  artifactData: "base64-encoded-artifact-data",
  artifactType: "ebook", // Optional: type of artifact
  artifactExtension: ".epub" // Optional: file extension
}
```

**Returns**:
```javascript
{
  success: true,
  artifactName: "generated-uuid.epub"
}
```

**Validation**:
- Requires uuid, title, and artifactData
- Product must exist
- User must exist
- Decodes base64 artifact data and saves to `./artifacts/` directory
- Generates UUID for artifact filename with extension
- Appends artifact to product's artifacts array

**Implementation Notes**:
- Artifact data must be base64 encoded for MAGIC spell transmission
- Supports any file format through extension parameter
- Original direct route accepts multipart file uploads
- MAGIC route uses base64 encoding for simplicity
- Multiple artifacts can be added to same product

---

### 6. Update Order
**Direct Route**: `PUT /user/:uuid/orders`
**MAGIC Spell**: `sanoraUserOrders`
**Cost**: 50 MP

**Components**:
```javascript
{
  uuid: "user-uuid",
  order: {
    userUUID: "order-user-uuid",
    productId: "product-id",
    amount: 9999,
    status: "pending", // or "completed", "shipped", etc.
    // ... other order fields
  }
}
```

**Returns**:
```javascript
{
  success: true,
  user: {
    uuid: "user-uuid",
    // ... updated user object
  }
}
```

**Validation**:
- Requires uuid and order
- User must exist
- Order user (order.userUUID) must exist
- TODO: Payment verification should be added before order update

---

## Implementation Details

### File Changes

1. **`/src/server/node/src/magic/magic.js`** - Added six new spell handlers:
   - `sanoraUserCreate(spell)`
   - `sanoraUserProcessor(spell)`
   - `sanoraUserProduct(spell)`
   - `sanoraUserProductImage(spell)`
   - `sanoraUserProductArtifact(spell)`
   - `sanoraUserOrders(spell)`

2. **`/fount/src/server/node/spellbooks/spellbook.js`** - Added spell definitions with destinations and costs

3. **`/test/mocha/magic-spells.js`** - New test file with comprehensive spell tests

4. **`/test/mocha/package.json`** - Added `fount-js` dependency

### Authentication Flow

```
Client → Fount (resolver) → Sanora MAGIC handler → Business logic
           ↓
    Verifies signature
    Deducts MP
    Grants experience
    Grants nineum
```

**Before (Direct REST)**:
- Client signs request
- Sanora verifies signature directly
- Sanora executes business logic

**After (MAGIC Spell)**:
- Client signs spell
- Fount verifies signature & deducts MP
- Fount grants experience & nineum to caster
- Fount forwards to Sanora
- Sanora executes business logic (no auth needed)

### Naming Convention

Route path → Spell name transformation:
```
/user/create                            → sanoraUserCreate
/user/:uuid/processor/:processor        → sanoraUserProcessor
/user/:uuid/product/:title              → sanoraUserProduct
/user/:uuid/product/:title/image        → sanoraUserProductImage
/user/:uuid/product/:title/artifact     → sanoraUserProductArtifact
/user/:uuid/orders                      → sanoraUserOrders
```

Pattern: `[service][PathWithoutSlashesAndParams]`

### E-Commerce Integration

Sanora provides complete e-commerce functionality for Planet Nine:

**Payment Processing**:
- Integration with Addie for payment processor management
- Support for Stripe, Square, and other processors
- Automatic Addie user creation for payment capabilities
- Session-based checkout flow (direct routes)
- Signature-based checkout flow (MAGIC routes)

**Product Management**:
- Product creation with metadata
- Image upload and management
- Artifact storage for digital goods
- Product categorization and tagging
- Multiple artifacts per product support

**Order Management**:
- Order creation and updates
- Order status tracking
- Payment verification (TODO)
- Order history per user
- Product-specific order filtering

### File Upload Handling

Sanora handles file uploads differently between direct routes and MAGIC routes:

**Direct Routes (Multipart Form Data)**:
```javascript
// Using express-fileupload middleware
const image = req.files.image;
await image.mv('./images/' + imageUUID);
```

**MAGIC Routes (Base64 Encoding)**:
```javascript
// Base64 encoded in spell components
const imageBuffer = Buffer.from(imageData, 'base64');
await fs.promises.writeFile(`./images/${imageUUID}`, imageBuffer);
```

**Advantages of MAGIC Approach**:
- No special multipart handling required
- Works with standard JSON payloads
- Consistent with other MAGIC spell patterns
- Easy to sign and verify

**Considerations**:
- Base64 encoding increases payload size by ~33%
- May need payload size limits for large files
- Alternative: Generate pre-signed upload URLs

### Teleportation Support

Sanora includes comprehensive teleportation support for product discovery:

**BasePubKey**:
- Each Sanora user has a basePubKey for signing teleport tags
- Automatically set during user creation
- Used to sign product feeds for verification

**Teleportable Product Feed**:
- GET `/teleportable-products` endpoint generates HTML with embedded teleport tags
- Each product wrapped in `<teleportal>` tags
- Feed-level signature using basePubKey
- Supports multiple layout options (vertical-scrolling-stack, etc.)

**Product Discovery**:
- Products discoverable via Planet Nine teleportation protocol
- SVG-based product representations via BDO integration
- Emojicode and short code support for easy sharing
- Cross-base product visibility

### Addie Integration

Sanora relies heavily on Addie for payment operations:

**User Creation Flow**:
```javascript
// Create Addie user for payment capabilities
const addieUser = await addie.createUser();

// Store Addie user with Sanora user
await db.putUser({ pubKey, addieUser, basePubKey });
```

**Processor Configuration**:
```javascript
// Forward processor setup to Addie
const url = `${addie.baseURL}user/${uuid}/processor/${processor}`;
const resp = await fetch(url, { method: 'put', ... });
```

**Payment Intent Creation**:
- Session-based checkout creates payment intents
- Sanora signs requests on behalf of session users
- Forwards to Addie for Stripe/Square processing
- Returns client_secret for frontend completion

### Error Handling

All spell handlers return consistent error format:
```javascript
{
  success: false,
  error: "Error description"
}
```

**Common Errors**:
- Missing required fields
- User not found
- Product not found
- Order user not found
- File write errors
- Payment processor errors

## Testing

Run MAGIC spell tests:
```bash
cd sanora/test/mocha
npm install
npm test magic-spells.js
```

Test coverage:
- ✅ User creation via spell
- ✅ Product creation via spell
- ✅ Product image upload via spell (base64)
- ✅ Processor configuration via spell
- ✅ Missing pubKey validation
- ✅ Missing product fields validation
- ✅ Missing image fields validation
- ✅ Missing artifact fields validation
- ✅ Missing processor fields validation
- ✅ Missing order fields validation

## Benefits

1. **No Direct Authentication**: Sanora handlers don't need to verify signatures
2. **Centralized Auth**: All signature verification in one place (Fount)
3. **Automatic Rewards**: Every spell grants experience + nineum
4. **Gateway Rewards**: Gateway participants get 10% of rewards
5. **Reduced Code**: Sanora handlers simplified without auth logic
6. **Consistent Pattern**: Same flow across all services

## Sanora's Role in Planet Nine

Sanora is the **e-commerce service** that manages:

### Product Management
- Product listing creation and updates
- Image and artifact storage
- Product categorization and metadata
- Multiple artifact support for digital goods

### Payment Processing
- Integration with payment processors via Addie
- Stripe and Square support
- Session-based checkout flow
- Payment intent creation

### Order Management
- Order creation and tracking
- Status updates
- User order history
- Product-specific order filtering

### Teleportation & Discovery
- Product feed generation with teleport tags
- BasePubKey signing for verification
- Product discovery across bases
- BDO integration for product sharing

### Integration Points
- **Joan**: User authentication foundation
- **Fount**: Magic point and nineum coordination
- **Addie**: Payment processor management
- **BDO**: Product BDO storage and sharing
- **Stripe/Square**: Payment processing

## Next Steps

Progress on MAGIC route conversion:
- ✅ Joan (3 routes complete)
- ✅ Pref (4 routes complete)
- ✅ Aretha (4 routes complete)
- ✅ Continuebee (3 routes complete)
- ✅ BDO (4 routes complete)
- ✅ Julia (8 routes complete)
- ✅ Dolores (8 routes complete)
- ✅ Sanora (6 routes complete)
- ⏳ Addie
- ⏳ Covenant
- ⏳ Prof
- ⏳ Fount (internal routes)
- ⏳ Minnie (SMTP only, no HTTP routes)

## Last Updated
January 14, 2025
