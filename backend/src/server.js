require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sql, getPool, initializeDatabase, parseProduct, parseUser } = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "zanee-store-secret";
// Prefer serving a build placed in backend/public, but fall back to frontend/build
const CANDIDATE_DIRS = [path.resolve(__dirname, "../public"), path.resolve(__dirname, "../../frontend/build")];
let FRONTEND_DIST_DIR = CANDIDATE_DIRS.find((p) => fs.existsSync(path.join(p, "index.html"))) || CANDIDATE_DIRS[0];
const FRONTEND_INDEX_FILE = path.join(FRONTEND_DIST_DIR, "index.html");
const HAS_FRONTEND_BUILD = fs.existsSync(FRONTEND_INDEX_FILE);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      isLocked: user.isLocked,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function getUserById(userId) {
  const pool = await getPool();
  const result = await pool.request().input("id", sql.NVarChar, userId).query("SELECT * FROM dbo.Users WHERE Id = @id");
  return result.recordset[0] ? parseUser(result.recordset[0]) : null;
}

async function getUserByUsername(username) {
  const pool = await getPool();
  const result = await pool.request().input("username", sql.NVarChar, username).query("SELECT * FROM dbo.Users WHERE Username = @username");
  return result.recordset[0] ? parseUser(result.recordset[0]) : null;
}

async function getProducts({ q = "", category = "" } = {}) {
  const pool = await getPool();
  const request = pool.request();
  request.input("q", sql.NVarChar, `%${q}%`);
  request.input("category", sql.NVarChar, category);
  const result = await request.query(`
    SELECT p.*, c.Name AS CategoryName
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
    WHERE (@q = '%%' OR p.Name LIKE @q) AND (@category = '' OR c.Name = @category)
    ORDER BY p.Name
  `);
  return result.recordset.map(parseProduct);
}

async function getProductById(productId) {
  const pool = await getPool();
  const result = await pool.request().input("id", sql.NVarChar, productId).query(`
    SELECT p.*, c.Name AS CategoryName
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
    WHERE p.Id = @id
  `);
  return result.recordset[0] ? parseProduct(result.recordset[0]) : null;
}

async function getFavorites(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.NVarChar, userId).query(`
    SELECT p.*, c.Name AS CategoryName
    FROM dbo.Favorites f
    INNER JOIN dbo.Products p ON p.Id = f.ProductId
    INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
    WHERE f.UserId = @userId
  `);
  return result.recordset.map(parseProduct);
}

async function getCart(userId) {
  const pool = await getPool();
  const result = await pool.request().input("userId", sql.NVarChar, userId).query(`
    SELECT ci.UserId, ci.ProductId, ci.Quantity, p.*, c.Name AS CategoryName
    FROM dbo.CartItems ci
    INNER JOIN dbo.Products p ON p.Id = ci.ProductId
    INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
    WHERE ci.UserId = @userId
  `);
  return result.recordset.map((row) => ({
    userId: row.UserId,
    productId: row.ProductId,
    quantity: row.Quantity,
    product: parseProduct(row),
    subtotal: Number(row.Price) * row.Quantity,
  }));
}

async function getOrders(userId) {
  const pool = await getPool();
  const ordersResult = await pool.request().input("userId", sql.NVarChar, userId).query(`
    SELECT * FROM dbo.Orders
    WHERE UserId = @userId
    ORDER BY CreatedAt DESC
  `);

  const orders = [];
  for (const order of ordersResult.recordset) {
    const itemsResult = await pool.request().input("orderId", sql.NVarChar, order.Id).query(`
      SELECT oi.*, p.Name, p.Sku, p.Image, p.Specs, p.Description, p.WarrantyMonths, p.Stock, c.Name AS CategoryName
      FROM dbo.OrderItems oi
      INNER JOIN dbo.Products p ON p.Id = oi.ProductId
      INNER JOIN dbo.Categories c ON c.Id = p.CategoryId
      WHERE oi.OrderId = @orderId
    `);

    orders.push({
      id: order.Id,
      userId: order.UserId,
      username: order.Username,
      subtotal: Number(order.Subtotal),
      shippingFee: Number(order.ShippingFee),
      total: Number(order.Total),
      fulfillmentMethod: order.FulfillmentMethod,
      pickupDate: order.PickupDate,
      address: order.Address || "",
      paymentMethod: order.PaymentMethod,
      paymentStatus: order.PaymentStatus,
      status: order.Status,
      createdAt: order.CreatedAt,
      items: itemsResult.recordset.map((item) => ({
        productId: item.ProductId,
        quantity: item.Quantity,
        unitPrice: Number(item.UnitPrice),
        subtotal: Number(item.Subtotal),
        product: parseProduct(item),
      })),
    });
  }
  return orders;
}

async function getCategories() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT Name FROM dbo.Categories ORDER BY Name");
  return result.recordset.map((row) => row.Name);
}

async function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.query.token || null;

  if (!token) {
    return res.status(401).json({ message: "Thieu token xac thuc." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Phien dang nhap khong con hop le." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token khong hop le." });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "403 - Ban khong co quyen truy cap chuc nang nay." });
    }
    next();
  };
}

function recommendBuild(products, budget, purpose) {
  const purposeKey = Array.isArray(purpose) ? purpose[0] : purpose;
  const templates = {
    office: ["CPU", "Mainboard", "RAM", "SSD", "Case", "PSU", "Monitor"],
    basicGaming: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor", "Cooling"],
    heavyGaming: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor", "Cooling"],
    it: ["CPU", "Mainboard", "RAM", "SSD", "HDD", "Case", "PSU", "Monitor", "Cooling"],
    content: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor", "Cooling", "Accessory"],
  };
  const route = templates[purposeKey] || templates.office;
  const maxPerCategory = Math.max(Math.floor(budget / route.length), 500000);
  const selected = route
    .map((category) => {
      const candidates = products
        .filter((item) => item.category === category && item.price <= maxPerCategory * 2)
        .sort((a, b) => b.price - a.price);
      return candidates.find((item) => item.price <= maxPerCategory) || candidates[candidates.length - 1];
    })
    .filter(Boolean);

  let total = selected.reduce((sum, item) => sum + item.price, 0);
  if (total > budget) {
    selected.sort((a, b) => b.price - a.price);
    while (selected.length > 6 && total > budget) {
      const removed = selected.shift();
      total -= removed.price;
    }
  }
  return { items: selected, total, delta: budget - total };
}

app.get("/api/health", async (req, res) => {
  const pool = await getPool();
  await pool.request().query("SELECT 1 AS ok");
  res.json({ ok: true, service: "Zanee.Store API", database: process.env.DB_NAME || "ZaneeStore", timestamp: new Date().toISOString() });
});

app.get("/api/bootstrap", async (req, res) => {
  const [categoriesData, products] = await Promise.all([getCategories(), getProducts()]);
  res.json({
    categories: categoriesData,
    products,
    featured: products.slice(0, 8),
    credentialsHint: {
      admin: { username: "admin", password: "Admin@123" },
      user: { username: "minhdev", password: "User@123" },
      locked: { username: "blockeduser", password: "Locked@123" },
    },
  });
});

app.get("/api/products", async (req, res) => {
  const products = await getProducts({ q: (req.query.q || "").toString(), category: req.query.category || "" });
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Khong tim thay san pham." });
  }
  return res.json(product);
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, phone, password } = req.body;
  if (!username || !email || !phone || !password) {
    return res.status(400).json({ message: "Vui long nhap du username, email, so dien thoai va mat khau." });
  }

  const pool = await getPool();
  const exists = await pool
    .request()
    .input("username", sql.NVarChar, username)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .query("SELECT TOP 1 * FROM dbo.Users WHERE Username = @username OR Email = @email OR Phone = @phone");

  if (exists.recordset[0]) {
    return res.status(409).json({ message: "Username, email hoac so dien thoai da ton tai." });
  }

  const user = {
    id: `usr-${Date.now()}`,
    username,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    isLocked: false,
    createdAt: new Date(),
  };

  await pool
    .request()
    .input("id", sql.NVarChar, user.id)
    .input("username", sql.NVarChar, user.username)
    .input("email", sql.NVarChar, user.email)
    .input("phone", sql.NVarChar, user.phone)
    .input("passwordHash", sql.NVarChar, user.passwordHash)
    .input("role", sql.NVarChar, user.role)
    .input("isLocked", sql.Bit, user.isLocked)
    .input("createdAt", sql.DateTime2, user.createdAt)
    .query(`
      INSERT INTO dbo.Users (Id, Username, Email, Phone, PasswordHash, Role, IsLocked, CreatedAt)
      VALUES (@id, @username, @email, @phone, @passwordHash, @role, @isLocked, @createdAt)
    `);

  return res.status(201).json({
    token: issueToken(user),
    user: sanitizeUser(user),
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Sai username hoac password." });
  }
  return res.json({ token: issueToken(user), user: sanitizeUser(user) });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { username, phone, newPassword } = req.body;
  const pool = await getPool();
  const result = await pool
    .request()
    .input("username", sql.NVarChar, username)
    .input("phone", sql.NVarChar, phone)
    .query("SELECT TOP 1 * FROM dbo.Users WHERE Username = @username AND Phone = @phone");

  if (!result.recordset[0]) {
    return res.status(404).json({ message: "Thong tin xac thuc khong dung, khong the dat lai mat khau." });
  }

  await pool
    .request()
    .input("id", sql.NVarChar, result.recordset[0].Id)
    .input("passwordHash", sql.NVarChar, bcrypt.hashSync(newPassword || "123456", 10))
    .query("UPDATE dbo.Users SET PasswordHash = @passwordHash WHERE Id = @id");

  return res.json({ message: "Dat lai mat khau thanh cong." });
});

app.get("/api/me", authRequired, async (req, res) => {
  const [favorites, cart, orders] = await Promise.all([
    getFavorites(req.user.id),
    getCart(req.user.id),
    getOrders(req.user.id),
  ]);
  res.json({ user: sanitizeUser(req.user), favorites, cart, orders });
});

app.post("/api/favorites/:productId", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Admin khong su dung danh sach yeu thich." });
  }

  const pool = await getPool();
  const existing = await pool
    .request()
    .input("userId", sql.NVarChar, req.user.id)
    .input("productId", sql.NVarChar, req.params.productId)
    .query("SELECT TOP 1 * FROM dbo.Favorites WHERE UserId = @userId AND ProductId = @productId");

  if (existing.recordset[0]) {
    await pool
      .request()
      .input("userId", sql.NVarChar, req.user.id)
      .input("productId", sql.NVarChar, req.params.productId)
      .query("DELETE FROM dbo.Favorites WHERE UserId = @userId AND ProductId = @productId");
  } else {
    await pool
      .request()
      .input("userId", sql.NVarChar, req.user.id)
      .input("productId", sql.NVarChar, req.params.productId)
      .query("INSERT INTO dbo.Favorites (UserId, ProductId) VALUES (@userId, @productId)");
  }

  res.json({ favorites: await getFavorites(req.user.id) });
});

app.post("/api/cart", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Admin khong co gio hang mua sam." });
  }
  const { productId, quantity = 1 } = req.body;
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.NVarChar, req.user.id)
    .input("productId", sql.NVarChar, productId)
    .input("quantity", sql.Int, Number(quantity))
    .query(`
      MERGE dbo.CartItems AS target
      USING (SELECT @userId AS UserId, @productId AS ProductId, @quantity AS Quantity) AS source
      ON target.UserId = source.UserId AND target.ProductId = source.ProductId
      WHEN MATCHED THEN UPDATE SET Quantity = target.Quantity + source.Quantity
      WHEN NOT MATCHED THEN INSERT (UserId, ProductId, Quantity) VALUES (source.UserId, source.ProductId, source.Quantity);
    `);
  res.json({ cart: await getCart(req.user.id) });
});

app.patch("/api/cart/:productId", authRequired, async (req, res) => {
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.NVarChar, req.user.id)
    .input("productId", sql.NVarChar, req.params.productId)
    .input("quantity", sql.Int, Math.max(1, Number(req.body.quantity) || 1))
    .query("UPDATE dbo.CartItems SET Quantity = @quantity WHERE UserId = @userId AND ProductId = @productId");
  res.json({ cart: await getCart(req.user.id) });
});

app.delete("/api/cart/:productId", authRequired, async (req, res) => {
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.NVarChar, req.user.id)
    .input("productId", sql.NVarChar, req.params.productId)
    .query("DELETE FROM dbo.CartItems WHERE UserId = @userId AND ProductId = @productId");
  res.json({ cart: await getCart(req.user.id) });
});

app.post("/api/pc-builder", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Chuc nang build PC chi danh cho user." });
  }
  const products = await getProducts();
  const plan = recommendBuild(products, Number(req.body.budget || 0), req.body.purpose || []);
  const pool = await getPool();
  await pool.request().input("userId", sql.NVarChar, req.user.id).query("DELETE FROM dbo.CartItems WHERE UserId = @userId");
  for (const item of plan.items) {
    await pool
      .request()
      .input("userId", sql.NVarChar, req.user.id)
      .input("productId", sql.NVarChar, item.id)
      .input("quantity", sql.Int, 1)
      .query("INSERT INTO dbo.CartItems (UserId, ProductId, Quantity) VALUES (@userId, @productId, @quantity)");
  }
  res.json({ ...plan, cart: await getCart(req.user.id) });
});

app.post("/api/orders", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Chuc nang mua hang chi danh cho user." });
  }

  const cart = await getCart(req.user.id);
  if (!cart.length) {
    return res.status(400).json({ message: "Gio hang dang trong." });
  }

  const { fulfillmentMethod, address = "", paymentMethod } = req.body;
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = fulfillmentMethod === "delivery" ? 30000 : 0;
  const total = subtotal + shippingFee;
  const orderId = `ord-${Date.now()}`;
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const status = fulfillmentMethod === "pickup" ? "Cho nhan tai store" : "Dang chuan bi giao";

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await new sql.Request(transaction)
      .input("id", sql.NVarChar, orderId)
      .input("userId", sql.NVarChar, req.user.id)
      .input("username", sql.NVarChar, req.user.username)
      .input("subtotal", sql.BigInt, subtotal)
      .input("shippingFee", sql.BigInt, shippingFee)
      .input("total", sql.BigInt, total)
      .input("fulfillmentMethod", sql.NVarChar, fulfillmentMethod)
      .input("pickupDate", sql.DateTime2, pickupDate)
      .input("address", sql.NVarChar, address)
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("paymentStatus", sql.NVarChar, paymentMethod === "vnpay" ? "paid-sandbox" : "pending-cod")
      .input("status", sql.NVarChar, status)
      .input("createdAt", sql.DateTime2, new Date())
      .query(`
        INSERT INTO dbo.Orders
        (Id, UserId, Username, Subtotal, ShippingFee, Total, FulfillmentMethod, PickupDate, Address, PaymentMethod, PaymentStatus, Status, CreatedAt)
        VALUES
        (@id, @userId, @username, @subtotal, @shippingFee, @total, @fulfillmentMethod, @pickupDate, @address, @paymentMethod, @paymentStatus, @status, @createdAt)
      `);

    for (const item of cart) {
      await new sql.Request(transaction)
        .input("orderId", sql.NVarChar, orderId)
        .input("productId", sql.NVarChar, item.productId)
        .input("quantity", sql.Int, item.quantity)
        .input("unitPrice", sql.BigInt, item.product.price)
        .input("subtotal", sql.BigInt, item.subtotal)
        .query(`
          INSERT INTO dbo.OrderItems (OrderId, ProductId, Quantity, UnitPrice, Subtotal)
          VALUES (@orderId, @productId, @quantity, @unitPrice, @subtotal)
        `);
    }

    await new sql.Request(transaction)
      .input("userId", sql.NVarChar, req.user.id)
      .query("DELETE FROM dbo.CartItems WHERE UserId = @userId");
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const orders = await getOrders(req.user.id);
  const order = orders.find((item) => item.id === orderId);
  res.status(201).json({
    message: "Thanh toan thanh cong, hoa don da duoc luu.",
    order,
    paymentUrl: paymentMethod === "vnpay" ? `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order_id=${orderId}` : null,
  });
});

app.get("/api/orders/:id/stream", authRequired, async (req, res) => {
  const orders = await getOrders(req.user.id);
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Khong tim thay don hang." });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const pushEvent = () => {
    const etaMinutes = Math.max(0, Math.round((new Date(order.pickupDate).getTime() - Date.now()) / 60000));
    res.write(`data: ${JSON.stringify({ orderId: order.id, status: order.status, etaMinutes })}\n\n`);
  };
  pushEvent();
  const timer = setInterval(pushEvent, 5000);
  req.on("close", () => clearInterval(timer));
});

app.patch("/api/account/password", authRequired, async (req, res) => {
  const currentUser = await getUserById(req.user.id);
  if (!bcrypt.compareSync(req.body.currentPassword || "", currentUser.passwordHash)) {
    return res.status(400).json({ message: "Mat khau hien tai khong dung." });
  }
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.NVarChar, req.user.id)
    .input("passwordHash", sql.NVarChar, bcrypt.hashSync(req.body.newPassword, 10))
    .query("UPDATE dbo.Users SET PasswordHash = @passwordHash WHERE Id = @id");
  res.json({ message: "Doi mat khau thanh cong." });
});

app.get("/api/admin/stats", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  const [users, products, orders, revenue] = await Promise.all([
    pool.request().query("SELECT SUM(CASE WHEN Role = 'user' THEN 1 ELSE 0 END) AS totalUsers, SUM(CASE WHEN Role = 'admin' THEN 1 ELSE 0 END) AS totalAdmins FROM dbo.Users"),
    pool.request().query("SELECT COUNT(*) AS totalProducts FROM dbo.Products"),
    pool.request().query("SELECT COUNT(*) AS totalOrders FROM dbo.Orders"),
    pool.request().query("SELECT ISNULL(SUM(Total), 0) AS totalRevenue FROM dbo.Orders"),
  ]);
  res.json({
    totalUsers: users.recordset[0].totalUsers || 0,
    totalAdmins: users.recordset[0].totalAdmins || 0,
    totalProducts: products.recordset[0].totalProducts || 0,
    totalOrders: orders.recordset[0].totalOrders || 0,
    totalRevenue: Number(revenue.recordset[0].totalRevenue || 0),
  });
});

app.get("/api/admin/users", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM dbo.Users ORDER BY CreatedAt DESC");
  res.json(result.recordset.map((row) => sanitizeUser(parseUser(row))));
});

app.patch("/api/admin/users/:id/toggle-lock", authRequired, requireRole("admin"), async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Khong tim thay nguoi dung." });
  }
  if (user.role === "admin") {
    return res.status(400).json({ message: "Khong the khoa tai khoan admin." });
  }
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.NVarChar, user.id)
    .input("isLocked", sql.Bit, !user.isLocked)
    .query("UPDATE dbo.Users SET IsLocked = @isLocked WHERE Id = @id");
  const updated = await getUserById(user.id);
  res.json({ user: sanitizeUser(updated) });
});

app.get("/api/admin/orders", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  const usersOrders = await pool.request().query("SELECT DISTINCT UserId FROM dbo.Orders");
  const orders = [];
  for (const row of usersOrders.recordset) {
    orders.push(...(await getOrders(row.UserId)));
  }
  res.json(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get("/api/admin/categories", authRequired, requireRole("admin"), async (req, res) => {
  res.json(await getCategories());
});

app.post("/api/admin/categories", authRequired, requireRole("admin"), async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "Ten danh muc khong duoc de trong." });
  }
  const pool = await getPool();
  await pool.request().input("name", sql.NVarChar, name).query("INSERT INTO dbo.Categories (Name) VALUES (@name)");
  res.status(201).json(await getCategories());
});

app.put("/api/admin/categories/:name", authRequired, requireRole("admin"), async (req, res) => {
  const oldName = req.params.name;
  const newName = String(req.body.name || "").trim();
  const pool = await getPool();
  await pool
    .request()
    .input("oldName", sql.NVarChar, oldName)
    .input("newName", sql.NVarChar, newName)
    .query("UPDATE dbo.Categories SET Name = @newName WHERE Name = @oldName");
  res.json(await getCategories());
});

app.delete("/api/admin/categories/:name", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  let otherCategory = await pool.request().query("SELECT TOP 1 Id FROM dbo.Categories WHERE Name = 'Khac'");
  if (!otherCategory.recordset[0]) {
    await pool.request().query("INSERT INTO dbo.Categories (Name) VALUES ('Khac')");
    otherCategory = await pool.request().query("SELECT TOP 1 Id FROM dbo.Categories WHERE Name = 'Khac'");
  }
  const deleteCategory = await pool.request().input("name", sql.NVarChar, req.params.name).query("SELECT TOP 1 Id FROM dbo.Categories WHERE Name = @name");
  if (deleteCategory.recordset[0]) {
    await pool
      .request()
      .input("categoryId", sql.Int, deleteCategory.recordset[0].Id)
      .input("otherCategoryId", sql.Int, otherCategory.recordset[0].Id)
      .query("UPDATE dbo.Products SET CategoryId = @otherCategoryId WHERE CategoryId = @categoryId");
    await pool.request().input("categoryId", sql.Int, deleteCategory.recordset[0].Id).query("DELETE FROM dbo.Categories WHERE Id = @categoryId");
  }
  res.json(await getCategories());
});

app.post("/api/admin/products", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  const category = await pool.request().input("name", sql.NVarChar, req.body.category).query("SELECT TOP 1 Id FROM dbo.Categories WHERE Name = @name");
  const product = {
    id: `prd-${Date.now()}`,
    sku: `ZNS-${Date.now()}`,
    image: req.body.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  };
  await pool
    .request()
    .input("id", sql.NVarChar, product.id)
    .input("sku", sql.NVarChar, product.sku)
    .input("name", sql.NVarChar, req.body.name)
    .input("categoryId", sql.Int, category.recordset[0].Id)
    .input("price", sql.BigInt, Number(req.body.price))
    .input("warrantyMonths", sql.Int, Number(req.body.warrantyMonths))
    .input("stock", sql.Int, Number(req.body.stock))
    .input("image", sql.NVarChar, product.image)
    .input("specs", sql.NVarChar(sql.MAX), JSON.stringify(Array.isArray(req.body.specs) ? req.body.specs : []))
    .input("description", sql.NVarChar(sql.MAX), req.body.description)
    .query(`
      INSERT INTO dbo.Products (Id, Sku, Name, CategoryId, Price, WarrantyMonths, Stock, Image, Specs, Description)
      VALUES (@id, @sku, @name, @categoryId, @price, @warrantyMonths, @stock, @image, @specs, @description)
    `);
  res.status(201).json(await getProductById(product.id));
});

app.put("/api/admin/products/:id", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  const category = await pool.request().input("name", sql.NVarChar, req.body.category).query("SELECT TOP 1 Id FROM dbo.Categories WHERE Name = @name");
  await pool
    .request()
    .input("id", sql.NVarChar, req.params.id)
    .input("name", sql.NVarChar, req.body.name)
    .input("categoryId", sql.Int, category.recordset[0].Id)
    .input("price", sql.BigInt, Number(req.body.price))
    .input("warrantyMonths", sql.Int, Number(req.body.warrantyMonths))
    .input("stock", sql.Int, Number(req.body.stock))
    .input("image", sql.NVarChar, req.body.image || "")
    .input("specs", sql.NVarChar(sql.MAX), JSON.stringify(Array.isArray(req.body.specs) ? req.body.specs : []))
    .input("description", sql.NVarChar(sql.MAX), req.body.description)
    .query(`
      UPDATE dbo.Products
      SET Name = @name, CategoryId = @categoryId, Price = @price, WarrantyMonths = @warrantyMonths,
          Stock = @stock, Image = @image, Specs = @specs, Description = @description
      WHERE Id = @id
    `);
  res.json(await getProductById(req.params.id));
});

app.delete("/api/admin/products/:id", authRequired, requireRole("admin"), async (req, res) => {
  const pool = await getPool();
  await pool.request().input("id", sql.NVarChar, req.params.id).query("DELETE FROM dbo.Products WHERE Id = @id");
  res.json({ message: "Da xoa san pham." });
});

if (HAS_FRONTEND_BUILD) {
  app.use(express.static(FRONTEND_DIST_DIR));
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Loi server." });
});

app.use((req, res) => {
  if (!req.path.startsWith("/api")) {
    if (HAS_FRONTEND_BUILD) {
      return res.sendFile(FRONTEND_INDEX_FILE);
    }
    return res.status(404).send("Page not found.");
  }
  res.status(404).json({ message: "API khong ton tai." });
});

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Zanee.Store API is running at http://localhost:${PORT}`);
      console.log(`Connected SQL Server DB: ${process.env.DB_NAME || "ZaneeStore"}`);
      if (HAS_FRONTEND_BUILD) {
        console.log(`Serving frontend build from ${FRONTEND_DIST_DIR}`);
      }
    });
  } catch (error) {
    console.error("Failed to start backend with SQL Server:", error.message);
    process.exit(1);
  }
})();
