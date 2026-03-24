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
const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

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

app.use(cors());
app.use(express.json({ limit: "1mb" }));

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

async function readUsers() {
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

async function ensureUserStore() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, "[]\n", "utf8");
  }

  const users = await readUsers();
  if (users.length > 0) {
    return;
  }

  const seeded = await Promise.all(
    seedUsers.map(async (user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
      isLocked: user.isLocked,
      createdAt: new Date().toISOString(),
    }))
  );

  await writeUsers(seeded);
}

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Zanee Store copy auth API",
    timestamp: new Date().toISOString(),
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
    (item) =>
      item.username.toLowerCase() === String(username).toLowerCase() ||
      item.email.toLowerCase() === String(email).toLowerCase() ||
      item.phone === String(phone)
  );

  if (existing) {
    return res
      .status(409)
      .json({ message: "Username, email hoac so dien thoai da ton tai." });
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
  return res.json({ user: sanitizeUser(req.user) });
});

app.use((error, req, res, next) => {
  const message = error && error.message ? error.message : "Server error";
  console.error(error);
  res.status(500).json({ message });
});

ensureUserStore()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth API is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start backend:", error);
    process.exit(1);
  });
