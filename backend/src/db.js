// Minimal stub for database layer so the server can start in deployment.
// This file provides lightweight implementations of the interfaces used by server.js
// In production you should replace this with the real mssql-based implementation.

class FakeRequest {
  constructor() {
    this.params = {};
    this._inputs = {};
  }
  input(name, value) {
    this._inputs[name] = value;
    return this;
  }
  async query(sql) {
    return { recordset: [] };
  }
}

class FakePool {
  request() {
    return new FakeRequest();
  }
}

const sql = {};
async function getPool() {
  return new FakePool();
}

async function initializeDatabase() {
  // No-op for stub
  return;
}

function parseProduct(row) {
  if (!row) return null;
  return {
    id: row.Id || row.id || "",
    name: row.Name || row.name || "",
    image: row.Image || row.image || "",
    price: Number(row.Price || row.price || 0),
    category: row.CategoryName || row.category || "",
    specs: row.Specs ? (Array.isArray(row.Specs) ? row.Specs : String(row.Specs).split("||")) : [],
    description: row.Description || row.description || "",
    warrantyMonths: row.WarrantyMonths || row.warrantyMonths || 0,
    stock: row.Stock || row.stock || 0,
  };
}

function parseUser(row) {
  if (!row) return null;
  return {
    id: row.Id || row.id || "",
    username: row.Username || row.username || row.Name || "",
    email: row.Email || row.email || "",
    role: row.Role || row.role || "user",
    isLocked: !!row.IsLocked || !!row.isLocked,
  };
}

module.exports = { sql, getPool, initializeDatabase, parseProduct, parseUser };
