# Sanora - Planet Nine Social Graph Service

## Overview

Sanora is a Planet Nine allyabase microservice that manages social connections and relationships with sessionless authentication.

**Location**: `/sanora/`
**Port**: 3002 (default)

## Core Features

### 👥 **Social Graph**
- **Connections**: Manage user connections and relationships
- **Follow/Unfollow**: Social graph operations
- **Connection Queries**: Retrieve user connections
- **Sessionless Auth**: All operations use cryptographic signatures

## API Endpoints

### Social Operations
- `PUT /user/create` - Create social user
- `POST /connection` - Create connection
- `GET /user/:uuid/connections` - Get user connections
- `DELETE /connection` - Remove connection

### MAGIC Protocol
- `POST /magic/spell/:spellName` - Execute MAGIC spells for social operations

### Health & Status
- `GET /health` - Service health check

## MAGIC Route Conversion (October 2025)

All Sanora REST endpoints have been converted to MAGIC protocol spells:

### Converted Spells (4 total)
1. **sanoraUserCreate** - Create social user
2. **sanoraConnection** - Create connection
3. **sanoraUserConnections** - Get user connections
4. **sanoraConnectionDelete** - Remove connection

**Testing**: Comprehensive MAGIC spell tests available in `/test/mocha/magic-spells.js` (10 tests covering success and error cases)

**Documentation**: See `/MAGIC-ROUTES.md` for complete spell specifications and migration guide

## Implementation Details

**Location**: `/src/server/node/src/magic/magic.js`

All social graph operations maintain the same functionality as the original REST endpoints while benefiting from centralized Fount authentication and MAGIC protocol features like experience granting and gateway rewards.

## Orders Webpage (October 2025)

Sanora includes a publicly accessible orders dashboard protected by AuthTeam authentication.

### Features
- **AuthTeam Protection**: Color sequence challenge (5 random colors)
- **Session-Based Auth**: 1-hour session duration
- **Orders Display**: All orders with color-coded status badges
- **Shipping Addresses**: Highlighted address section (yellow background)
- **Responsive Design**: Gradient background, grid layout
- **Auto-Refresh**: Manual refresh button

### Endpoints
- `GET /authteam` - Generate AuthTeam challenge
- `POST /authteam/complete` - Complete challenge and authenticate
- `GET /orders` - Protected orders dashboard

### Access

Visit: `http://localhost:7243/orders` (redirects to AuthTeam if not authenticated)

### Database Method

**getAllOrders()** (`/src/server/node/src/persistence/db.js:161`)
- Fetches all orders from Redis
- Deduplicates by orderId
- Sorts by createdAt (most recent first)

### Testing

Comprehensive tests available in Sharon:
```bash
cd sharon
npm run test:sanora:orders
```

**Test Coverage**: 32 tests covering AuthTeam, session management, orders display, shipping addresses, and security.

## Last Updated
October 24, 2025 - Added orders webpage with AuthTeam authentication and comprehensive Sharon tests. Completed full MAGIC protocol conversion. All 4 routes now accessible via MAGIC spells with centralized Fount authentication.
