import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000/api";

function Reservations() {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: 1,
    name: "",
    phone: "",
    table_id: "",
  });
  const [allTables, setAllTables] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAllReservations = async () => {
    try {
      const res = await fetch(`${API_URL}/reservations`);
      setAllReservations(await res.json());
    } catch (err) {
      console.error("Failed to fetch reservations");
    }
  };
  const fetchAllTables = async () => {
    try {
      const res = await fetch(`${API_URL}/tables`);
      setAllTables(await res.json());
    } catch (err) {
      console.error("Failed to fetch tables");
    }
  };

  useEffect(() => {
    fetchAllReservations();
    fetchAllTables();
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formData.table_id) return setError("Please select a table.");
    try {
      const res = await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          reservation_date: formData.date,
          reservation_time: formData.time,
          number_of_guests: formData.guests,
          table_id: formData.table_id,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setSuccess(result.message);
      fetchAllReservations();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-wrapper form-grid">
      <div>
        <h2 className="page-title">Make a Reservation</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <form
          onSubmit={handleSubmit}
          className="form-grid"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Guests</label>
            <input
              type="number"
              name="guests"
              min="1"
              value={formData.guests}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Select a Table</label>
            <select
              name="table_id"
              value={formData.table_id}
              onChange={handleChange}
              required
            >
              <option value="">-- All Tables --</option>
              {allTables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.table_number} (Capacity: {t.capacity})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="form-button">
              Book Reservation
            </button>
          </div>
        </form>
      </div>
      <div>
        <h2 className="page-title">Upcoming Reservations</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Date & Time</th>
              <th>Guests</th>
              <th>Table</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allReservations.map((r) => (
              <tr key={r.id}>
                <td>{r.customer_name}</td>
                <td>{r.customer_phone}</td>
                <td>
                  {new Date(r.reservation_date).toLocaleDateString()}{" "}
                  {r.reservation_time}
                </td>
                <td>{r.number_of_guests}</td>
                <td>{r.table_number || "N/A"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderOnline() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/menu`)
      .then((res) => res.json())
      .then(setMenu)
      .catch(() => setError("Could not load menu."));
  }, []);
  const addToCart = (item) => {
    setCart((prev) => {
      const e = prev.find((i) => i.id === item.id);
      if (e) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, special_requests: "" }];
    });
  };
  const handleSpecialRequestChange = (itemId, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, special_requests: value } : item
      )
    );
  };
  const placeOrder = async () => {
    setError("");
    setSuccess("");
    if (cart.length === 0 || !customer.phone) {
      setError(!customer.phone ? "Phone number is required" : "Cart is empty.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.name || "Guest",
          customer_phone: customer.phone,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            special_requests: item.special_requests,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setSuccess(result.message);
      setCart([]);
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="page-wrapper form-grid">
      <div>
        <h3 className="page-title">Menu</h3>
        <div className="menu-grid">
          {menu.map((item) => (
            <div key={item.id} className="menu-item-card">
              <img src={item.image_url} alt={item.name} />
              <div className="menu-item-content">
                <h4>
                  {item.name} - ₹{item.price}
                </h4>
                <p>{item.description}</p>
                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(item)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="page-title">Customer & Cart</h3>
        <div className="form-group">
          <label>Customer Name</label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Customer Phone (Required)</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            required
          />
        </div>
        <h4>Cart</h4>
        {cart.length > 0 ? (
          cart.map((item) => (
            <div key={item.id} className="cart-item">
              <span>
                {item.name} x {item.quantity}
              </span>
              <input
                type="text"
                placeholder="Special requests..."
                value={item.special_requests}
                onChange={(e) =>
                  handleSpecialRequestChange(item.id, e.target.value)
                }
                style={{ marginTop: "5px", width: "95%", padding: "5px" }}
              />
            </div>
          ))
        ) : (
          <p>Cart is empty.</p>
        )}
        <h4>Total: ₹{cartTotal.toFixed(2)}</h4>
        <button className="form-button" onClick={placeOrder}>
          Place Order & Get Points
        </button>
        {error && (
          <p className="error-message" style={{ marginTop: "1rem" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="success-message" style={{ marginTop: "1rem" }}>
            {success}
          </p>
        )}
      </div>
    </div>
  );
}

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`);
      setOrders(await res.json());
    } catch (err) {
      console.error("Error loading orders.");
    }
  };
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);
  const updateStatus = async (orderId, newStatus) => {
    await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
  };
  const activeOrders = orders.filter(
    (o) => o.status === "New" || o.status === "Preparing"
  );
  const completedOrders = orders.filter(
    (o) => o.status !== "New" && o.status !== "Preparing"
  );

  return (
    <div className="page-wrapper">
      <h2 className="page-title">Active Orders</h2>
      <div className="kds-grid">
        {activeOrders.map((order) => (
          <div
            key={order.id}
            className="kds-order-card"
            data-status={order.status}
          >
            <h3>
              Order #{order.id} - {order.customer_name}
            </h3>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.item_name} x {item.quantity}
                </li>
              ))}
            </ul>
            <div className="kds-actions">
              {order.status === "New" && (
                <button onClick={() => updateStatus(order.id, "Preparing")}>
                  Start Preparing
                </button>
              )}
              {order.status === "Preparing" && (
                <button onClick={() => updateStatus(order.id, "Ready")}>
                  Mark as Ready
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <h2 className="page-title" style={{ marginTop: "2rem" }}>
        Completed & Archived Orders
      </h2>
      <div className="kds-grid">
        {completedOrders.map((order) => (
          <div
            key={order.id}
            className="kds-order-card"
            data-status={order.status}
          >
            <h3>
              Order #{order.id} - {order.customer_name}
            </h3>
            <p>
              Status: <strong>{order.status}</strong>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Loyalty() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState(
    "Search for a customer to see their loyalty points."
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    setResults([]);
    if (!searchTerm) return;
    try {
      const res = await fetch(
        `${API_URL}/customers/search?query=${searchTerm}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResults(data);
    } catch (err) {
      setMessage(err.message || "No customer found.");
    }
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">Loyalty Program</h2>
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Name, Phone, or Email"
          style={{ flexGrow: 1 }}
        />
        <button type="submit" className="form-button">
          Search
        </button>
      </form>
      {message && <p>{message}</p>}
      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Loyalty Points</th>
            </tr>
          </thead>
          <tbody>
            {results.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.loyalty_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Reservations");
  const renderContent = () => {
    switch (activeTab) {
      case "Reservations":
        return <Reservations />;
      case "Order":
        return <OrderOnline />;
      case "Kitchen Display":
        return <KitchenDisplay />;
      case "Loyalty":
        return <Loyalty />;
      default:
        return <Reservations />;
    }
  };
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Restaurant Dashboard</h1>
        <nav>
          <button
            onClick={() => setActiveTab("Reservations")}
            className={activeTab === "Reservations" ? "active" : ""}
          >
            Reservations
          </button>
          <button
            onClick={() => setActiveTab("Order")}
            className={activeTab === "Order" ? "active" : ""}
          >
            Order
          </button>
          <button
            onClick={() => setActiveTab("Kitchen Display")}
            className={activeTab === "Kitchen Display" ? "active" : ""}
          >
            Kitchen Display
          </button>
          <button
            onClick={() => setActiveTab("Loyalty")}
            className={activeTab === "Loyalty" ? "active" : ""}
          >
            Loyalty
          </button>
        </nav>
      </header>
      <main className="content-container">{renderContent()}</main>
    </div>
  );
}
