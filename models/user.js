const db = require('../util/database');

module.exports = class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  save() {
    return db.execute(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [this.name, this.email]
    );
  }

  static findById(id) {
    return db.execute('SELECT * FROM users WHERE id = ?', [id]);
  }

  // static findOne() {
  //   return db.execute('SELECT * FROM users LIMIT 1');
  // }

  // Cart Methods

  getCart() {
    return db.execute(`
      SELECT p.*, ci.quantity
      FROM products p
      JOIN cart_items ci ON p.id = ci.productId
      JOIN carts c ON ci.cartId = c.id
      WHERE c.userId = ?
    `, [this.id])
      .then(([rows]) => {
        // Transform to match Mongoose structure expected by views
        // Views likely expect: items array where item has { productId: productObj, quantity: val }
        return rows.map(row => {
          return {
            productId: { ...row, _id: row.id }, // Map id to _id just in case view uses _id
            quantity: row.quantity,
            _id: row.id // product id top level? Mongoose cart item structure is { productId: ..., quantity: ... }
          };
        });
      });
  }

  addToCart(product) {
    let cartId;
    // 1. Find or create cart
    return db.execute('SELECT id FROM carts WHERE userId = ?', [this.id])
      .then(([rows]) => {
        if (rows.length > 0) {
          cartId = rows[0].id;
          return Promise.resolve();
        } else {
          return db.execute('INSERT INTO carts (userId) VALUES (?)', [this.id])
            .then(([result]) => {
              cartId = result.insertId;
            });
        }
      })
      .then(() => {
        // 2. Check if product in cart
        return db.execute('SELECT * FROM cart_items WHERE cartId = ? AND productId = ?', [cartId, product.id]);
      })
      .then(([rows]) => {
        if (rows.length > 0) {
          // Update quantity
          return db.execute('UPDATE cart_items SET quantity = quantity + 1 WHERE cartId = ? AND productId = ?', [cartId, product.id]);
        } else {
          // Insert new item
          return db.execute('INSERT INTO cart_items (cartId, productId, quantity) VALUES (?, ?, 1)', [cartId, product.id]);
        }
      });
  }

  deleteItemFromCart(productId) {
    // Simplification: Assume user has a cart.
    return db.execute('SELECT id FROM carts WHERE userId = ?', [this.id])
      .then(([rows]) => {
        if (rows.length > 0) {
          return db.execute('DELETE FROM cart_items WHERE cartId = ? AND productId = ?', [rows[0].id, productId]);
        }
      });
  }

  addOrder() {
    let cartId;
    let cartItems;
    // 1. Get Cart Logic (simplified reuse)
    return db.execute('SELECT id FROM carts WHERE userId = ?', [this.id])
      .then(([rows]) => {
        if (rows.length === 0) return;
        cartId = rows[0].id;
        return db.execute('SELECT productId, quantity FROM cart_items WHERE cartId = ?', [cartId]);
      })
      .then(([rows]) => {
        cartItems = rows;
        if (!cartItems || cartItems.length === 0) return;
        // 2. Create Order
        return db.execute('INSERT INTO orders (userId) VALUES (?)', [this.id]);
      })
      .then(([result]) => {
        if (!cartItems || cartItems.length === 0) return;
        const orderId = result.insertId;
        // 3. Insert Order Items
        // Using a loop or complex insert. Loop is easier to write safely now.
        const promises = cartItems.map(item => {
          return db.execute('INSERT INTO order_items (orderId, productId, quantity) VALUES (?, ?, ?)',
            [orderId, item.productId, item.quantity]);
        });
        return Promise.all(promises);
      })
      .then(() => {
        // 4. Clear Cart
        return db.execute('DELETE FROM cart_items WHERE cartId = ?', [cartId]);
      });
  }

  getOrders() {
    // Fetch orders and items
    // This is the tricky Mongoose replace.
    // Need structured: [{ id, user: { ... }, products: [{ ...product, orderItem: { quantity } }] }]
    // Views: order.products.forEach... p.title, p.orderItem.quantity
    return db.execute('SELECT * FROM orders WHERE userId = ?', [this.id])
      .then(([orders]) => {
        const orderPromises = orders.map(order => {
          return db.execute(`
                    SELECT p.*, oi.quantity 
                    FROM products p
                    JOIN order_items oi ON p.id = oi.productId
                    WHERE oi.orderId = ?
                `, [order.id])
            .then(([products]) => {
              // Map to expected structure
              order.products = products.map(p => {
                return {
                  product: {
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    description: p.description,
                    imageUrl: p.imageUrl
                  },
                  quantity: p.quantity
                }; // Mimic Mongoose structure often used in this course
              });
              return order;
            });
        });
        return Promise.all(orderPromises);
      });
  }
};
