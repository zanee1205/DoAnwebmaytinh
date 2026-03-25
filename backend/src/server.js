require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "zanee-store-copy-secret";
const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const SOURCE_CATALOG_FILE = path.join(__dirname, "..", "..", "Zanee Store", "backend", "data", "db.json");

const seedUsers = [
  {
    id: "usr-admin",
    username: "admin",
    email: "admin@zaneestore.local",
    phone: "0900000001",
    password: "Admin@123",
    role: "admin",
    isLocked: false,
  },
  {
    id: "usr-minhdev",
    username: "minhdev",
    email: "minhdev@zaneestore.local",
    phone: "0900000002",
    password: "User@123",
    role: "user",
    isLocked: false,
  },
  {
    id: "usr-blocked",
    username: "blockeduser",
    email: "blocked@zaneestore.local",
    phone: "0900000003",
    password: "Locked@123",
    role: "user",
    isLocked: true,
  },
];

const defaultStore = {
  categories: [],
  products: [],
  favorites: [
    { userId: "usr-minhdev", productId: "prd-19" },
    { userId: "usr-minhdev", productId: "prd-6" },
  ],
  cartItems: [
    { userId: "usr-minhdev", productId: "prd-12", quantity: 1 },
    { userId: "usr-minhdev", productId: "prd-15", quantity: 1 },
  ],
  orders: [],
};

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

function normalizeStoreShape(store) {
  return {
    categories: Array.isArray(store?.categories) ? store.categories : [],
    products: Array.isArray(store?.products) ? store.products : [],
    favorites: Array.isArray(store?.favorites) ? store.favorites : [],
    cartItems: Array.isArray(store?.cartItems) ? store.cartItems : [],
    orders: Array.isArray(store?.orders) ? store.orders : [],
  };
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readUsers() {
  const parsed = await readJson(USERS_FILE, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeUsers(users) {
  await writeJson(USERS_FILE, users);
}

async function readStore() {
  const store = await readJson(STORE_FILE, defaultStore);
  return normalizeStoreShape(store);
}

async function writeStore(store) {
  await writeJson(STORE_FILE, normalizeStoreShape(store));
}

async function ensureUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const existingUsers = await readUsers();
  const deduped = [];
  const seenKeys = new Set();

  for (const user of existingUsers) {
    const key = `${String(user.username || "").toLowerCase()}|${String(user.email || "").toLowerCase()}|${String(user.phone || "")}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(user);
    }
  }

  let changed = deduped.length !== existingUsers.length;
  for (const seed of seedUsers) {
    const exists = deduped.some(
      (user) =>
        String(user.username || "").toLowerCase() === seed.username.toLowerCase() ||
        String(user.email || "").toLowerCase() === seed.email.toLowerCase() ||
        String(user.phone || "") === seed.phone
    );

    if (!exists) {
      deduped.push({
        id: seed.id,
        username: seed.username,
        email: seed.email,
        phone: seed.phone,
        passwordHash: await bcrypt.hash(seed.password, 10),
        role: seed.role,
        isLocked: seed.isLocked,
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
  }

  if (changed || existingUsers.length === 0) {
    await writeUsers(deduped);
  }
}

async function ensureStoreData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const existing = await readStore();
  if (existing.products.length > 0 && existing.categories.length > 0) {
    return;
  }

  const sourceCatalog = await readJson(SOURCE_CATALOG_FILE, null);
  const store = {
    ...defaultStore,
    categories: Array.isArray(sourceCatalog?.categories) ? sourceCatalog.categories : [],
    products: Array.isArray(sourceCatalog?.products) ? sourceCatalog.products : [],
  };

  await writeStore(store);
}

function getProductById(store, productId) {
  return store.products.find((product) => product.id === productId) || null;
}

function getFavorites(store, userId) {
  return store.favorites
    .filter((item) => item.userId === userId)
    .map((item) => getProductById(store, item.productId))
    .filter(Boolean);
}

function getCart(store, userId) {
  return store.cartItems
    .filter((item) => item.userId === userId)
    .map((item) => {
      const product = getProductById(store, item.productId);
      if (!product) {
        return null;
      }

      return {
        userId,
        productId: item.productId,
        quantity: item.quantity,
        product,
        subtotal: product.price * item.quantity,
      };
    })
    .filter(Boolean);
}

function getOrders(store, userId) {
  return store.orders
    .filter((order) => order.userId === userId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function deriveCategories(products) {
  return [...new Set(products.map((product) => String(product.category || "").trim()).filter(Boolean))];
}

function normalizeSpecs(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getNextProductId(products) {
  const maxId = products.reduce((max, product) => {
    const match = String(product.id || "").match(/^prd-(\d+)$/i);
    if (!match) {
      return max;
    }
    return Math.max(max, Number(match[1] || 0));
  }, 0);

  return `prd-${maxId + 1}`;
}

function generateSku(products) {
  const next = products.length + 1;
  return `ZNS-${String(next).padStart(4, "0")}`;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function buildProductPayload(input, currentProduct = null) {
  const name = input?.name !== undefined ? String(input.name).trim() : currentProduct?.name;
  const category = input?.category !== undefined ? String(input.category).trim() : currentProduct?.category;
  const description = input?.description !== undefined ? String(input.description).trim() : currentProduct?.description;
  const image = input?.image !== undefined ? String(input.image).trim() : currentProduct?.image;
  const sku = input?.sku !== undefined ? String(input.sku).trim() : currentProduct?.sku;

  const priceInput = input?.price !== undefined ? input.price : currentProduct?.price;
  const warrantyInput = input?.warrantyMonths !== undefined ? input.warrantyMonths : currentProduct?.warrantyMonths;
  const stockInput = input?.stock !== undefined ? input.stock : currentProduct?.stock;
  const specsInput = input?.specs !== undefined ? input.specs : currentProduct?.specs;

  const price = toOptionalNumber(priceInput);
  const warrantyMonths = toOptionalNumber(warrantyInput);
  const stock = toOptionalNumber(stockInput);
  const specs = normalizeSpecs(specsInput);

  const errors = [];
  if (!name) {
    errors.push("Ten san pham la bat buoc.");
  }
  if (!category) {
    errors.push("Danh muc san pham la bat buoc.");
  }
  if (!Number.isFinite(price) || price <= 0) {
    errors.push("Gia san pham phai la so > 0.");
  }
  if (!Number.isFinite(warrantyMonths) || warrantyMonths < 0) {
    errors.push("Bao hanh phai la so >= 0.");
  }
  if (!Number.isFinite(stock) || stock < 0) {
    errors.push("Ton kho phai la so >= 0.");
  }

  return {
    errors,
    product: {
      name,
      category,
      description: description || "",
      image: image || "",
      sku: sku || "",
      price: Math.round(price || 0),
      warrantyMonths: Math.round(warrantyMonths || 0),
      stock: Math.round(stock || 0),
      specs,
    },
  };
}

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token || null;

  if (!token) {
    return res.status(401).json({ message: "Thieu token xac thuc." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find((item) => item.id === payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Phien dang nhap khong con hop le." });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Token khong hop le." });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Ban khong co quyen admin de thuc hien thao tac nay." });
  }
  return next();
}

function recommendBuild(products, budget, purpose) {
  const purposeKey = Array.isArray(purpose) ? purpose[0] : purpose;
  const templates = {
    office: ["CPU", "Mainboard", "RAM", "SSD", "Case", "PSU", "Monitor"],
    basicGaming: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor"],
    heavyGaming: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor", "Cooling"],
    it: ["CPU", "Mainboard", "RAM", "SSD", "HDD", "Case", "PSU", "Monitor"],
    content: ["CPU", "Mainboard", "RAM", "SSD", "GPU", "Case", "PSU", "Monitor", "Accessory"],
  };
  const route = templates[purposeKey] || templates.office;
  const maxPerCategory = Math.max(Math.floor(Number(budget || 0) / route.length), 500000);
  const items = route
    .map((category) => {
      const candidates = products
        .filter((product) => product.category === category)
        .sort((left, right) => left.price - right.price);
      return candidates.find((product) => product.price <= maxPerCategory) || candidates[0] || null;
    })
    .filter(Boolean);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  return {
    items,
    total,
    delta: Number(budget || 0) - total,
  };
}

app.get("/api/health", async (req, res) => {
  const store = await readStore();
  res.json({
    ok: true,
    service: "Zanee Store copy storefront API",
    products: store.products.length,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/bootstrap", async (req, res) => {
  const store = await readStore();
  res.json({
    categories: store.categories,
    products: store.products,
    featured: store.products.slice(0, 8),
    credentialsHint: {
      admin: { username: "admin", password: "Admin@123" },
      user: { username: "minhdev", password: "User@123" },
      locked: { username: "blockeduser", password: "Locked@123" },
    },
  });
});

app.get("/api/products", async (req, res) => {
  const store = await readStore();
  const query = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "");
  const products = store.products.filter((product) => {
    const matchesQuery = !query || product.name.toLowerCase().includes(query);
    const matchesCategory = !category || product.category === category;
    return matchesQuery && matchesCategory;
  });
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const store = await readStore();
  const product = getProductById(store, req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Khong tim thay san pham." });
  }
  return res.json(product);
});

app.get("/api/admin/products", authRequired, adminRequired, async (req, res) => {
  const store = await readStore();
  const query = String(req.query.q || "").toLowerCase();
  const products = !query
    ? store.products
    : store.products.filter((product) => {
        return (
          String(product.name || "").toLowerCase().includes(query) ||
          String(product.sku || "").toLowerCase().includes(query)
        );
      });

  return res.json({
    count: products.length,
    categories: store.categories,
    products,
  });
});

app.post("/api/admin/products", authRequired, adminRequired, async (req, res) => {
  const store = await readStore();
  const { errors, product } = buildProductPayload(req.body, null);

  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  const nextProduct = {
    id: getNextProductId(store.products),
    sku: product.sku || generateSku(store.products),
    image: product.image,
    name: product.name,
    category: product.category,
    price: product.price,
    warrantyMonths: product.warrantyMonths,
    stock: product.stock,
    specs: product.specs,
    description: product.description,
  };

  store.products.push(nextProduct);
  store.categories = deriveCategories(store.products);
  await writeStore(store);

  return res.status(201).json({
    message: "Them san pham thanh cong.",
    product: nextProduct,
  });
});

app.patch("/api/admin/products/:id", authRequired, adminRequired, async (req, res) => {
  const store = await readStore();
  const index = store.products.findIndex((product) => product.id === req.params.id);

  if (index < 0) {
    return res.status(404).json({ message: "Khong tim thay san pham can cap nhat." });
  }

  const currentProduct = store.products[index];
  const { errors, product } = buildProductPayload(req.body, currentProduct);
  if (errors.length) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  const updatedProduct = {
    ...currentProduct,
    ...product,
    sku: product.sku || currentProduct.sku || generateSku(store.products),
  };

  store.products[index] = updatedProduct;
  store.categories = deriveCategories(store.products);
  await writeStore(store);

  return res.json({
    message: "Cap nhat san pham thanh cong.",
    product: updatedProduct,
  });
});

app.delete("/api/admin/products/:id", authRequired, adminRequired, async (req, res) => {
  const store = await readStore();
  const product = getProductById(store, req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Khong tim thay san pham can xoa." });
  }

  store.products = store.products.filter((item) => item.id !== req.params.id);
  store.favorites = store.favorites.filter((item) => item.productId !== req.params.id);
  store.cartItems = store.cartItems.filter((item) => item.productId !== req.params.id);
  store.categories = deriveCategories(store.products);
  await writeStore(store);

  return res.json({
    message: "Xoa san pham thanh cong.",
    productId: req.params.id,
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, phone, password } = req.body || {};

  if (!username || !email || !phone || !password) {
    return res.status(400).json({
      message: "Vui long nhap du username, email, so dien thoai va mat khau.",
    });
  }

  const users = await readUsers();
  const existing = users.find(
    (user) =>
      user.username.toLowerCase() === String(username).toLowerCase() ||
      user.email.toLowerCase() === String(email).toLowerCase() ||
      user.phone === String(phone)
  );

  if (existing) {
    return res.status(409).json({ message: "Username, email hoac so dien thoai da ton tai." });
  }

  const user = {
    id: `usr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    username: String(username).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    passwordHash: await bcrypt.hash(String(password), 10),
    role: "user",
    isLocked: false,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);

  return res.status(201).json({
    token: issueToken(user),
    user: sanitizeUser(user),
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  const users = await readUsers();
  const user = users.find(
    (item) => item.username.toLowerCase() === String(username || "").toLowerCase()
  );

  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    return res.status(401).json({ message: "Sai username hoac password." });
  }

  return res.json({ token: issueToken(user), user: sanitizeUser(user) });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { username, phone, newPassword } = req.body || {};
  const users = await readUsers();
  const user = users.find(
    (item) =>
      item.username.toLowerCase() === String(username || "").toLowerCase() &&
      item.phone === String(phone || "")
  );

  if (!user) {
    return res.status(404).json({
      message: "Thong tin xac thuc khong dung, khong the dat lai mat khau.",
    });
  }

  user.passwordHash = await bcrypt.hash(String(newPassword || "123456"), 10);
  await writeUsers(users);

  return res.json({ message: "Dat lai mat khau thanh cong." });
});

app.get("/api/me", authRequired, async (req, res) => {
  const store = await readStore();
  return res.json({
    user: sanitizeUser(req.user),
    favorites: getFavorites(store, req.user.id),
    cart: getCart(store, req.user.id),
    orders: getOrders(store, req.user.id),
  });
});

app.post("/api/favorites/:productId", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Admin khong su dung danh sach yeu thich." });
  }

  const store = await readStore();
  const product = getProductById(store, req.params.productId);
  if (!product) {
    return res.status(404).json({ message: "Khong tim thay san pham." });
  }

  const favoriteIndex = store.favorites.findIndex(
    (item) => item.userId === req.user.id && item.productId === req.params.productId
  );

  if (favoriteIndex >= 0) {
    store.favorites.splice(favoriteIndex, 1);
  } else {
    store.favorites.push({ userId: req.user.id, productId: req.params.productId });
  }

  await writeStore(store);
  res.json({ favorites: getFavorites(store, req.user.id) });
});

app.post("/api/cart", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Admin khong co gio hang mua sam." });
  }

  const { productId, quantity = 1 } = req.body || {};
  const store = await readStore();
  const product = getProductById(store, productId);
  if (!product) {
    return res.status(404).json({ message: "Khong tim thay san pham." });
  }

  const existingItem = store.cartItems.find(
    (item) => item.userId === req.user.id && item.productId === productId
  );
  const safeQuantity = Math.max(1, Number(quantity) || 1);

  if (existingItem) {
    existingItem.quantity += safeQuantity;
  } else {
    store.cartItems.push({ userId: req.user.id, productId, quantity: safeQuantity });
  }

  await writeStore(store);
  res.json({ cart: getCart(store, req.user.id) });
});

app.patch("/api/cart/:productId", authRequired, async (req, res) => {
  const store = await readStore();
  const item = store.cartItems.find(
    (cartItem) => cartItem.userId === req.user.id && cartItem.productId === req.params.productId
  );

  if (!item) {
    return res.status(404).json({ message: "Khong tim thay san pham trong gio hang." });
  }

  item.quantity = Math.max(1, Number(req.body?.quantity) || 1);
  await writeStore(store);
  res.json({ cart: getCart(store, req.user.id) });
});

app.delete("/api/cart/:productId", authRequired, async (req, res) => {
  const store = await readStore();
  store.cartItems = store.cartItems.filter(
    (item) => !(item.userId === req.user.id && item.productId === req.params.productId)
  );
  await writeStore(store);
  res.json({ cart: getCart(store, req.user.id) });
});

app.post("/api/pc-builder", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Chuc nang build PC chi danh cho user." });
  }

  const store = await readStore();
  const plan = recommendBuild(store.products, req.body?.budget, req.body?.purpose || []);
  store.cartItems = store.cartItems.filter((item) => item.userId !== req.user.id);
  for (const product of plan.items) {
    store.cartItems.push({ userId: req.user.id, productId: product.id, quantity: 1 });
  }
  await writeStore(store);
  res.json({ ...plan, cart: getCart(store, req.user.id) });
});

app.post("/api/orders", authRequired, async (req, res) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Chuc nang mua hang chi danh cho user." });
  }

  const store = await readStore();
  const cart = getCart(store, req.user.id);
  if (!cart.length) {
    return res.status(400).json({ message: "Gio hang dang trong." });
  }

  const fulfillmentMethod = String(req.body?.fulfillmentMethod || "pickup");
  const paymentMethod = String(req.body?.paymentMethod || "pickup");
  const address = String(req.body?.address || "").trim();

  if (fulfillmentMethod === "delivery" && !address) {
    return res.status(400).json({ message: "Vui long nhap dia chi giao hang." });
  }

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = fulfillmentMethod === "delivery" ? 30000 : 0;
  const total = subtotal + shippingFee;
  const orderId = `ord-${Date.now()}`;
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const order = {
    id: orderId,
    userId: req.user.id,
    username: req.user.username,
    subtotal,
    shippingFee,
    total,
    fulfillmentMethod,
    pickupDate,
    address,
    paymentMethod,
    paymentStatus: paymentMethod === "vnpay" ? "paid-sandbox" : "pending-cod",
    status: fulfillmentMethod === "pickup" ? "Cho nhan tai store" : "Dang chuan bi giao",
    createdAt: new Date().toISOString(),
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.subtotal,
      product: item.product,
    })),
  };

  store.orders.push(order);
  store.cartItems = store.cartItems.filter((item) => item.userId !== req.user.id);
  await writeStore(store);

  res.status(201).json({
    message: "Thanh toan thanh cong, hoa don da duoc luu.",
    order,
    paymentUrl: paymentMethod === "vnpay" ? `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order_id=${orderId}` : null,
  });
});

app.get("/api/orders/:id", authRequired, async (req, res) => {
  const store = await readStore();
  const order = getOrders(store, req.user.id).find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Khong tim thay don hang." });
  }
  return res.json(order);
});

app.get("/api/orders/:id/stream", authRequired, async (req, res) => {
  const store = await readStore();
  const order = getOrders(store, req.user.id).find((item) => item.id === req.params.id);
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

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error?.message || "Server error" });
});

app.use((req, res) => {
  res.status(404).json({ message: "API khong ton tai." });
});

Promise.all([ensureUserStore(), ensureStoreData()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Store API is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
