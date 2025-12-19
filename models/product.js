const db = require('../util/database');

module.exports = class Product {
  constructor(id, title, imageUrl, description, price, userId) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
    this.userId = userId;
  }

  save() {
    if (this.id) {
      return db.execute('UPDATE products SET title=?, price=?, imageUrl=?, description=?, userId=? WHERE id=?',
        [this.title, this.price, this.imageUrl, this.description, this.userId, this.id]);
    }
    return db.execute(
      'INSERT INTO products (title, price, imageUrl, description, userId) VALUES (?, ?, ?, ?, ?)',
      [this.title, this.price, this.imageUrl, this.description, this.userId]
    );
  }

  static deleteById(id) {
    return db.execute('DELETE FROM products WHERE id = ?', [id]);
  }

  static fetchAll() {
    return db.execute('SELECT * FROM products');
  }

  static findById(id) {
    return db.execute('SELECT * FROM products WHERE id = ?', [id]);
  }
};
