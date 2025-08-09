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
 <summary><code>GET</code> <code><b>/teleportable-products</b></code> <code>Returns teleportable product feed pages for embedding in other websites</code></summary>

##### Parameters

> | name         |  required     | data type               | description                                                           |
> |--------------|-----------|-------------------------|-----------------------------------------------------------------------|
> | layout       |  false    | string                  | Layout type: "vertical-scrolling-stack" (default) or "horizontal-scrolling-stack" |

##### Supported Layouts

**Vertical Scrolling Stack** (default):
- Products displayed in a single vertical column
- Centered layout with max width of 600px
- Natural vertical scrolling behavior
- Perfect for narrow embedding spaces

**Horizontal Scrolling Stack**:
- Products displayed in a horizontal carousel
- Interactive scroll buttons and smooth scrolling
- Fixed card width for consistent presentation
- Great for showcasing products in banner format

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `text/html`                       | HTML page with embedded teleportable product feed   |
> | `404`         | `text/plain`                      | `Not found`                            |

##### Example URLs

> ```bash
> # Vertical layout (default)
> https://dev.sanora.allyabase.com/teleportable-products
> 
> # Vertical layout (explicit)
> https://dev.sanora.allyabase.com/teleportable-products?layout=vertical-scrolling-stack
> 
> # Horizontal layout
> https://dev.sanora.allyabase.com/teleportable-products?layout=horizontal-scrolling-stack
> ```

##### Teleportation Protocol

These pages include proper `<teleport>` and `<teleportal>` tags that comply with the Planet Nine teleportation protocol, allowing other websites to:

- Parse and extract product information
- Embed product feeds dynamically  
- Create cross-site product discovery
- Build decentralized marketplace experiences

##### Features

- **JavaScript-free teleport tags**: All styling uses inline CSS for maximum compatibility
- **Responsive design**: Works on desktop and mobile devices
- **Visual feedback**: Hover effects and smooth animations
- **Environment aware**: Automatically adapts URLs for localhost vs production
- **Graceful fallbacks**: Handles empty product lists elegantly
- **SEO friendly**: Proper semantic HTML structure

</details>