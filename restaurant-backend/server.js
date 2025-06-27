const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  let connection;
  try {
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await tempConnection.query(
      `DROP DATABASE IF EXISTS \`${process.env.DB_NAME}\`;`
    );
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
    );
    await tempConnection.end();
    connection = await pool.getConnection();

    await connection.query(
      "CREATE TABLE IF NOT EXISTS menu_items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price DECIMAL(10, 2) NOT NULL, category VARCHAR(100), image_url VARCHAR(255) NULL)"
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS tables (id INT AUTO_INCREMENT PRIMARY KEY, table_number VARCHAR(50) NOT NULL UNIQUE, capacity INT NOT NULL)"
    );

    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    await connection.query("DROP TABLE IF EXISTS order_items;");
    await connection.query("DROP TABLE IF EXISTS orders;");
    await connection.query("DROP TABLE IF EXISTS reservations;");
    await connection.query("DROP TABLE IF EXISTS customers;");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    await connection.query(
      `CREATE TABLE customers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, phone VARCHAR(20) UNIQUE, email VARCHAR(255) UNIQUE, loyalty_points INT DEFAULT 0)`
    );
    await connection.query(
      `CREATE TABLE reservations (id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(20), reservation_date DATE NOT NULL, reservation_time TIME NOT NULL, number_of_guests INT NOT NULL, table_id INT, status VARCHAR(50) DEFAULT 'Confirmed', FOREIGN KEY (table_id) REFERENCES tables(id))`
    );
    await connection.query(
      `CREATE TABLE orders (id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(255), customer_phone VARCHAR(20), customer_email VARCHAR(255), order_date DATETIME DEFAULT CURRENT_TIMESTAMP, total_amount DECIMAL(10, 2) NOT NULL, status VARCHAR(50) DEFAULT 'New', loyalty_points_earned INT DEFAULT 0)`
    );
    await connection.query(
      `CREATE TABLE order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, item_id INT NOT NULL, item_name VARCHAR(255) NOT NULL, quantity INT NOT NULL, price DECIMAL(10, 2) NOT NULL, special_requests TEXT, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES menu_items(id))`
    );

    console.log("Schema verified. Transactional data cleared.");

    const [menuRows] = await connection.query(
      "SELECT COUNT(*) as count FROM menu_items"
    );
    if (menuRows[0].count === 0) {
      const menuData = [
        [
          "Samosa",
          "Crispy pastry with spiced potatoes.",
          120.0,
          "Appetizer",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/samosa.jpg",
        ],
        [
          "Paneer Tikka",
          "Cottage cheese cubes grilled.",
          320.0,
          "Appetizer",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/paneer_tikka.jpg",
        ],
        [
          "Dal Makhani",
          "Creamy black lentils.",
          350.0,
          "Main Course",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/dal_makhani.jpg",
        ],
        [
          "Chana Masala",
          "Spicy chickpea curry.",
          330.0,
          "Main Course",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/cholemasala.jpg",
        ],
        [
          "Roti",
          "Whole wheat flatbread.",
          40.0,
          "Breads",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/roti.jpg",
        ],
        [
          "Naan",
          "Soft tandoor flatbread.",
          80.0,
          "Breads",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/butter_naan.jpg",
        ],
        [
          "Gulab Jamun",
          "Milk-solid balls in syrup.",
          160.0,
          "Desserts",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/gulab_jamun.jpg",
        ],
        [
          "Mango Lassi",
          "Yogurt-based mango shake.",
          150.0,
          "Beverages",
          "https://restaurant-reservation-and-ordering-system.s3.us-east-1.amazonaws.com/mango-lassi.jpg",
        ],
      ];
      await connection.query(
        "INSERT INTO menu_items (name, description, price, category, image_url) VALUES ?",
        [menuData]
      );
    }
    const [tableRows] = await connection.query(
      "SELECT COUNT(*) as count FROM tables"
    );
    if (tableRows[0].count === 0) {
      const tableData = [
        ["Table 1", 2],
        ["Table 2", 4],
        ["Table 3", 4],
        ["Table 4", 6],
        ["Table 5", 8],
      ];
      await connection.query(
        "INSERT INTO tables (table_number, capacity) VALUES ?",
        [tableData]
      );
    }
    console.log("Static data verified.");
  } catch (err) {
    console.error("DB Init Failed:", err);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

app.get("/api/menu", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/tables", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tables");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/reservations", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT r.*, t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id ORDER BY r.reservation_date, r.reservation_time"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/reservations", async (req, res) => {
  const {
    customer_name,
    customer_phone,
    reservation_date,
    reservation_time,
    number_of_guests,
    table_id,
  } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO reservations (customer_name, customer_phone, reservation_date, reservation_time, number_of_guests, table_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        customer_name,
        customer_phone,
        reservation_date,
        reservation_time,
        number_of_guests,
        table_id,
      ]
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Reservation created!" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.get("/api/orders", async (req, res) => {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM orders ORDER BY order_date DESC"
    );
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id]
        );
        return { ...order, items };
      })
    );
    res.json(ordersWithItems);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.put("/api/orders/:order_id/status", async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      order_id,
    ]);
    res.json({ message: "Status updated" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/customers/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Query required" });
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE name LIKE ? OR phone = ? OR email = ?",
      [`%${query}%`, query, query]
    );
    if (rows.length > 0) res.json(rows);
    else res.status(404).json({ message: "Customer not found." });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/orders", async (req, res) => {
  const { customer_name, customer_phone, items } = req.body;
  if (!customer_phone)
    return res.status(400).json({ message: "Phone number required" });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const itemIds = items.map((i) => i.id);
    const [menuItems] = await connection.query(
      "SELECT id, name, price FROM menu_items WHERE id IN (?)",
      [itemIds]
    );
    const menuItemMap = new Map(
      menuItems.map((i) => [i.id, { name: i.name, price: i.price }])
    );
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += menuItemMap.get(item.id).price * item.quantity;
    }
    const loyaltyPointsEarned = Math.floor(totalAmount / 100);
    const [orderResult] = await connection.query(
      "INSERT INTO orders (customer_name, customer_phone, total_amount, loyalty_points_earned) VALUES (?, ?, ?, ?)",
      [customer_name, customer_phone, totalAmount, loyaltyPointsEarned]
    );
    const orderId = orderResult.insertId;
    const orderItemsValues = items.map((i) => [
      orderId,
      i.id,
      menuItemMap.get(i.id).name,
      i.quantity,
      menuItemMap.get(i.id).price,
      i.special_requests || null,
    ]);
    await connection.query(
      "INSERT INTO order_items (order_id, item_id, item_name, quantity, price, special_requests) VALUES ?",
      [orderItemsValues]
    );
    const [existingCustomers] = await connection.query(
      "SELECT * FROM customers WHERE phone = ?",
      [customer_phone]
    );
    if (existingCustomers.length > 0) {
      const newPoints =
        existingCustomers[0].loyalty_points + loyaltyPointsEarned;
      await connection.query(
        "UPDATE customers SET loyalty_points = ? WHERE id = ?",
        [newPoints, existingCustomers[0].id]
      );
    } else {
      await connection.query(
        "INSERT INTO customers (name, phone, loyalty_points) VALUES (?, ?, ?)",
        [customer_name || "Guest", customer_phone, loyaltyPointsEarned]
      );
    }
    await connection.commit();
    res.status(201).json({ message: "Order placed successfully!" });
  } catch (e) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    if (connection) connection.release();
  }
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
