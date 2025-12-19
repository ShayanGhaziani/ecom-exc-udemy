const db = require('./database');

async function setupTables() {
    try {
        console.log('Creating tables...');

        // Users Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `);
        console.log('Created users table');

        // Products Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        price DOUBLE NOT NULL,
        description TEXT NOT NULL,
        imageUrl VARCHAR(255) NOT NULL,
        userId INT,
        CONSTRAINT fk_products_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('Created products table');

        // Carts Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        CONSTRAINT fk_carts_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('Created carts table');

        // Cart Items Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cartId INT NOT NULL,
        productId INT NOT NULL,
        quantity INT NOT NULL,
        CONSTRAINT fk_cartItems_cart FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE,
        CONSTRAINT fk_cartItems_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
        console.log('Created cart_items table');

        // Orders Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('Created orders table');

        // Order Items Table
        await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId INT NOT NULL,
        productId INT NOT NULL,
        quantity INT NOT NULL,
        CONSTRAINT fk_orderItems_order FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_orderItems_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
        console.log('Created order_items table');
        console.log('All tables created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating tables:', err);
        process.exit(1);
    }
}

setupTables();
