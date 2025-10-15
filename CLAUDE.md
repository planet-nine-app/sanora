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

## Last Updated
October 14, 2025 - Completed full MAGIC protocol conversion. All 4 routes now accessible via MAGIC spells with centralized Fount authentication.
