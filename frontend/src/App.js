import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000/api";
const USER_ONLY_ROUTES = ["cart", "favorites", "orders"];

function currency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

function parseRoute() {
  const hash = window.location.hash.replace("#", "") || "/";
  const parts = hash.split("/").filter(Boolean);
  return {
    name: parts[0] || "home",
    id: parts[1] || null,
  };
}

function goTo(path) {
  window.location.hash = path;
}

async function api(path, options = {}) {
  const { token, body, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method: rest.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Co loi xay ra khi goi API.");
  }

  return data;
}

function ProductCard({ product, onDetail, onFavorite, onCart, onBuy, isFavorite, session }) {
  return (
    <div className="col-6 col-xl-3 col-lg-4">
      <div className="product-card h-100">
        <div className="product-image-wrap">
          <img className="product-image" src={product.image} alt={product.name} />
        </div>
        <div className="product-meta">
          <span className="badge rounded-pill text-bg-primary">{product.category}</span>
          <span className="small text-secondary">BH {product.warrantyMonths} thang</span>
        </div>
        <h3>{product.name}</h3>
        <p className="product-description-clamp">{product.description}</p>
        <ul className="spec-list">
          {product.specs.slice(0, 3).map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
        <div className="product-bottom">
          <div>
            <strong>{currency(product.price)}</strong>
            <div className="small text-secondary">Kho: {product.stock}</div>
          </div>
          <div className="icon-actions">
            <button className="btn btn-outline-light btn-sm" onClick={() => onDetail(product.id)}>
              Chi tiet
            </button>
            <button
              className={`btn btn-sm ${isFavorite ? "btn-info" : "btn-outline-info"}`}
              onClick={() => onFavorite(product.id)}
              disabled={session.user?.role === "admin"}
              title="Yeu thich"
            >
              <i className="bi bi-heart-fill" />
            </button>
          </div>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-outline-primary flex-fill" onClick={() => onCart(product.id)}>
            Them vao gio
          </button>
          <button className="btn btn-primary flex-fill" onClick={() => onBuy(product.id)}>
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ products, search, setSearch, session, cartCount, favoritesCount, onLogout, onSearchSubmit }) {
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return products
      .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [products, search]);

  return (
    <header className="sticky-top header-shell">
      <nav className="navbar navbar-expand-lg navbar-dark container py-3">
        <a className="navbar-brand brand-mark" href="#/">
          <span>Zanee.</span>Store
        </a>
        <form
          className="search-shell mx-lg-4 my-3 my-lg-0"
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <button type="submit" className="search-submit-btn" aria-label="Tim kiem san pham">
            <i className="bi bi-search" />
          </button>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tim may tinh, RAM, VGA, laptop..."
          />
          {!!suggestions.length && (
            <div className="suggestion-box">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  className="suggestion-item"
                  onClick={() => {
                    setSearch(item.name);
                    goTo(`/product/${item.id}`);
                  }}
                >
                  <span>{item.name}</span>
                  <strong>{currency(item.price)}</strong>
                </button>
              ))}
            </div>
          )}
        </form>
        <div className="d-flex align-items-center gap-2 ms-auto flex-wrap justify-content-end">
          <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/")}>
            Trang chu
          </button>
          {session.user?.role === "user" && (
            <>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/favorites")}>
                <i className="bi bi-heart" /> {favoritesCount}
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/cart")}>
                <i className="bi bi-cart3" /> {cartCount}
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/orders")}>
                Don hang
              </button>
            </>
          )}
          {!session.user ? (
            <button className="btn btn-primary btn-sm" onClick={() => goTo("/auth")}>
              Dang nhap / Dang ky
            </button>
          ) : (
            <>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/auth")}>
                {session.user.username}
              </button>
              <button className="btn btn-sm btn-info" onClick={onLogout}>
                Dang xuat
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function Hero({ products, categories, onCategory }) {
  return (
    <section className="hero-panel">
      <div>
        <span className="eyebrow">PC STORE | LINH KIEN VA MAY TINH</span>
        <h1>Trang chu va mua hang duoc chuyen tu Zanee Store</h1>
        <p>
          Ban rut gon nay giu lai luong chinh de xem san pham, them vao gio hang, luu yeu thich,
          dat mua va xem chi tiet don hang tren project hien tai.
        </p>
        <div className="d-flex gap-2 flex-wrap mt-4">
          <button className="btn btn-primary" onClick={() => goTo("/auth")}>
            Dang nhap de mua hang
          </button>
          <button className="btn btn-outline-light" onClick={() => onCategory("")}>
            Xem toan bo san pham
          </button>
        </div>
      </div>
      <div className="hero-card-grid">
        <div className="floating-card">
          <strong>{products.length}+</strong>
          <span>San pham cong nghe</span>
        </div>
        <div className="floating-card">
          <strong>{categories.length}</strong>
          <span>Danh muc linh kien</span>
        </div>
        <div className="floating-card full">
          <strong>0909954360</strong>
          <span> Ho tro dat hang va tu van cau hinh</span>
        </div>
      </div>
      <div className="category-strip">
        {categories.map((category) => (
          <button key={category} className="chip-button" onClick={() => onCategory(category)}>
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}

function HomePage({ products, categories, selectedCategory, setCategory, handlers, session, featured }) {
  return (
    <div className="page-shell">
      <Hero products={products} categories={categories} onCategory={setCategory} />
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Danh sach san pham</span>
            <h2>Trang chu</h2>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${!selectedCategory ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setCategory("")}
            >
              Tat ca
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`btn btn-sm ${selectedCategory === category ? "btn-primary" : "btn-outline-light"}`}
                onClick={() => setCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="row g-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDetail={handlers.onDetail}
              onFavorite={handlers.onFavorite}
              onCart={handlers.onCart}
              onBuy={handlers.onBuy}
              isFavorite={handlers.favorites.includes(product.id)}
              session={session}
            />
          ))}
        </div>
      </section>
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Noi bat</span>
            <h2>Mot so goi y hot</h2>
          </div>
        </div>
        <div className="row g-4">
          {featured.map((item) => (
            <div className="col-lg-3 col-md-6" key={item.id}>
              <div className="feature-card h-100">
                <div className="feature-image-wrap">
                  <img className="feature-image" src={item.image} alt={item.name} />
                </div>
                <span className="badge rounded-pill text-bg-info mb-3">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong>{currency(item.price)}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductDetail({ product, onCart, onBuy, isFavorite, onFavorite }) {
  if (!product) {
    return <ScreenCard title="Khong tim thay san pham" text="San pham ban chon khong ton tai hoac da bi xoa." />;
  }

  return (
    <div className="page-shell">
      <section className="detail-card">
        <div>
          <div className="detail-image-wrap mb-4">
            <img className="detail-image" src={product.image} alt={product.name} />
          </div>
          <span className="eyebrow">{product.category}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-grid">
            <div>
              <span>Gia niem yet</span>
              <strong>{currency(product.price)}</strong>
            </div>
            <div>
              <span>Bao hanh</span>
              <strong>{product.warrantyMonths} thang</strong>
            </div>
            <div>
              <span>Ma SKU</span>
              <strong>{product.sku}</strong>
            </div>
            <div>
              <span>Ton kho</span>
              <strong>{product.stock}</strong>
            </div>
          </div>
          <ul className="spec-list mt-4">
            {product.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
          <div className="d-flex gap-2 mt-4 flex-wrap">
            <button className="btn btn-outline-info" onClick={() => onFavorite(product.id)}>
              {isFavorite ? "Da luu yeu thich" : "Luu vao yeu thich"}
            </button>
            <button className="btn btn-outline-light" onClick={() => onCart(product.id)}>
              Them vao gio
            </button>
            <button className="btn btn-primary" onClick={() => onBuy(product.id)}>
              Mua ngay
            </button>
          </div>
        </div>
        <div className="side-info">
          <div className="feature-card">
            <h3>Cam ket tai Zanee.Store</h3>
            <p>Hang chinh hang, ho tro dat hang file-based va dong bo trang thai don hang ngay trong project copy.</p>
            <p>Dia chi: 161 Nguyen Gia Tri, Binh Thanh</p>
            <p>Hotline: 0909954360</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthPage({ mode, setMode, onLogin, onRegister, onReset, credentialsHint }) {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", phone: "", password: "" });
  const [resetForm, setResetForm] = useState({ username: "", phone: "", newPassword: "" });

  return (
    <div className="page-shell">
      <section className="auth-layout">
        <div className="glass-panel">
          <div className="auth-banner-wrap">
            <img className="auth-banner-image" src="https://picsum.photos/seed/zanee-auth/1200/900" alt="Zanee auth" />
          </div>
        </div>
        <div className="glass-panel">
          <div className="auth-form-shell">
            <span className="eyebrow">Tai khoan Zanee.Store</span>
            <h2 className="auth-welcome">Dang nhap de luu gio hang va dat hang</h2>
            <p className="auth-subtext">Ban rut gon nay da dua cac chuc nang mua hang tu project Zanee Store sang project hien tai.</p>
          </div>
          {mode === "login" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onLogin(loginForm); }}>
              <input className="form-control" placeholder="Username" value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              <input className="form-control" type="password" placeholder="Password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              <div className="auth-action-row">
                <button className="btn btn-primary auth-submit-btn">Dang nhap</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("register")}>Chua co tai khoan? Dang ky</button>
              </div>
              <button type="button" className="btn btn-link auth-forgot-link" onClick={() => setMode("reset")}>Quen mat khau</button>
            </form>
          )}
          {mode === "register" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onRegister(registerForm); }}>
              <input className="form-control" placeholder="Username" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} />
              <input className="form-control" placeholder="Email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
              <input className="form-control" placeholder="So dien thoai" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} />
              <input className="form-control" type="password" placeholder="Mat khau" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
              <div className="auth-action-row">
                <button className="btn btn-primary auth-submit-btn">Tao tai khoan</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("login")}>Da co tai khoan? Dang nhap</button>
              </div>
            </form>
          )}
          {mode === "reset" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onReset(resetForm); }}>
              <input className="form-control" placeholder="Username da dang ky" value={resetForm.username} onChange={(event) => setResetForm({ ...resetForm, username: event.target.value })} />
              <input className="form-control" placeholder="So dien thoai da dang ky" value={resetForm.phone} onChange={(event) => setResetForm({ ...resetForm, phone: event.target.value })} />
              <input className="form-control" type="password" placeholder="Mat khau moi" value={resetForm.newPassword} onChange={(event) => setResetForm({ ...resetForm, newPassword: event.target.value })} />
              <div className="auth-action-row">
                <button className="btn btn-primary auth-submit-btn">Dat lai mat khau</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("login")}>Quay lai dang nhap</button>
              </div>
            </form>
          )}
          <div className="credentials-panel mt-4">
            <p className="mb-2">Tai khoan demo:</p>
            <ul>
              <li>{credentialsHint.user.username} / {credentialsHint.user.password}</li>
              <li>{credentialsHint.admin.username} / {credentialsHint.admin.password}</li>
              <li>{credentialsHint.locked.username} / {credentialsHint.locked.password}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScreenCard({ title, text, children }) {
  return (
    <div className="page-shell">
      <section className="glass-panel text-center">
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
      </section>
    </div>
  );
}

function CartPage({ cart, onQuantity, onRemove, onCheckout }) {
  const [fulfillmentMethod, setFulfillmentMethod] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("pickup");
  const [address, setAddress] = useState("");
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = fulfillmentMethod === "delivery" ? 30000 : 0;
  const total = subtotal + shipping;

  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Gio hang</span>
            <h2>Xac nhan mat hang</h2>
          </div>
        </div>
        {!cart.length ? (
          <ScreenCard title="Gio hang dang trong" text="Hay them san pham tu trang chu hoac trang chi tiet san pham." />
        ) : (
          <div className="auth-layout">
            <div className="glass-panel">
              {cart.map((item) => (
                <div className="cart-row" key={item.productId}>
                  <div>
                    <strong>{item.product?.name}</strong>
                    <div className="small text-secondary">{item.product?.category}</div>
                  </div>
                  <input className="form-control qty-input" type="number" min="1" value={item.quantity} onChange={(event) => onQuantity(item.productId, Number(event.target.value))} />
                  <strong>{currency(item.subtotal)}</strong>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => onRemove(item.productId)}>Xoa</button>
                </div>
              ))}
            </div>
            <div className="glass-panel">
              <h3>Dat mua hang</h3>
              <div className="check-grid">
                <label className="check-item"><input type="radio" checked={fulfillmentMethod === "pickup"} onChange={() => setFulfillmentMethod("pickup")} /> <span>Nhan tai store</span></label>
                <label className="check-item"><input type="radio" checked={fulfillmentMethod === "delivery"} onChange={() => setFulfillmentMethod("delivery")} /> <span>Giao tan noi (+30.000d)</span></label>
              </div>
              {fulfillmentMethod === "delivery" && (
                <input className="form-control mt-3" placeholder="Dia chi nhan hang" value={address} onChange={(event) => setAddress(event.target.value)} />
              )}
              <div className="check-grid mt-3">
                <label className="check-item"><input type="radio" checked={paymentMethod === "pickup"} onChange={() => setPaymentMethod("pickup")} /> <span>Nhan hang tai store</span></label>
                <label className="check-item"><input type="radio" checked={paymentMethod === "delivery"} onChange={() => setPaymentMethod("delivery")} /> <span>Thanh toan khi giao hang</span></label>
                <label className="check-item"><input type="radio" checked={paymentMethod === "vnpay"} onChange={() => setPaymentMethod("vnpay")} /> <span>VNPAY sandbox</span></label>
              </div>
              <div className="detail-grid mt-4">
                <div><span>Tam tinh</span><strong>{currency(subtotal)}</strong></div>
                <div><span>Phi ship</span><strong>{currency(shipping)}</strong></div>
                <div><span>Tong thanh toan</span><strong>{currency(total)}</strong></div>
              </div>
              <button className="btn btn-primary w-100 mt-4" onClick={() => onCheckout({ fulfillmentMethod, paymentMethod, address })}>
                Dat mua hang
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FavoritesPage({ favorites, onDetail }) {
  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Yeu thich</span>
            <h2>San pham da luu</h2>
          </div>
        </div>
        {!favorites.length ? (
          <ScreenCard title="Chua co muc yeu thich" text="Ban co the bam trai tim o trang chu hoac trang chi tiet san pham." />
        ) : (
          <div className="row g-4">
            {favorites.map((item) => (
              <div className="col-md-6 col-xl-4" key={item.id}>
                <div className="feature-card h-100">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <strong>{currency(item.price)}</strong>
                  <button className="btn btn-outline-light mt-3" onClick={() => onDetail(item.id)}>Xem chi tiet</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrdersPage({ orders, onDetail }) {
  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Don hang</span>
            <h2>Lich su mua hang</h2>
          </div>
        </div>
        {!orders.length ? (
          <ScreenCard title="Chua co don hang" text="Sau khi dat mua hang, hoa don se duoc luu tai day." />
        ) : (
          <div className="row g-4">
            {orders.map((order) => (
              <div className="col-lg-6" key={order.id}>
                <div className="feature-card h-100">
                  <div className="d-flex justify-content-between gap-3 flex-wrap">
                    <strong>{order.id}</strong>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <p>{order.status}</p>
                  <p>Tong tien: <strong>{currency(order.total)}</strong></p>
                  <p>Thanh toan: {order.paymentMethod} | Nhan hang: {order.fulfillmentMethod}</p>
                  <button className="btn btn-outline-light" onClick={() => onDetail(order.id)}>
                    Xem chi tiet don hang
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OrderDetailPage({ order }) {
  if (!order) {
    return <ScreenCard title="Khong tim thay don hang" text="Don hang co the da bi xoa hoac khong thuoc tai khoan hien tai." />;
  }

  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Chi tiet don hang</span>
            <h2>{order.id}</h2>
          </div>
          <button className="btn btn-outline-light" onClick={() => goTo("/orders")}>Quay lai danh sach</button>
        </div>
        <div className="detail-grid">
          <div><span>Ngay tao</span><strong>{formatDate(order.createdAt)}</strong></div>
          <div><span>Trang thai</span><strong>{order.status}</strong></div>
          <div><span>Thanh toan</span><strong>{order.paymentMethod}</strong></div>
          <div><span>Hinh thuc nhan</span><strong>{order.fulfillmentMethod}</strong></div>
          <div><span>Dia chi</span><strong>{order.address || "Nhan tai store"}</strong></div>
          <div><span>Tong tien</span><strong>{currency(order.total)}</strong></div>
        </div>
        <div className="glass-panel order-items-panel mt-4">
          <h3>Danh sach san pham</h3>
          <div className="admin-list">
            {order.items.map((item) => (
              <div className="cart-row" key={`${order.id}-${item.productId}`}>
                <div>
                  <strong>{item.product.name}</strong>
                  <div className="small text-secondary">{item.product.category}</div>
                </div>
                <div className="small">SL: {item.quantity}</div>
                <div className="small">Don gia: {currency(item.unitPrice)}</div>
                <strong>{currency(item.subtotal)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer-shell">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-4">
            <h5>Zanee.Store</h5>
            <p>Ban copy da chuyen cac chuc nang mua hang chinh tu folder Zanee Store sang project hien tai.</p>
          </div>
          <div className="col-md-4">
            <h5>Lien he</h5>
            <p>Dia chi: 161 Nguyen Gia Tri, Binh Thanh</p>
            <p>Dien thoai: 0909954360</p>
          </div>
          <div className="col-md-4">
            <h5>Demo account</h5>
            <p>User: minhdev / User@123</p>
            <p>Admin: admin / Admin@123</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [route, setRoute] = useState(parseRoute());
  const [boot, setBoot] = useState({ products: [], categories: [], featured: [], credentialsHint: { admin: {}, user: {}, locked: {} } });
  const [session, setSession] = useState({ token: localStorage.getItem("zanee-token") || "", user: null, favorites: [], cart: [], orders: [] });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute());
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) goTo("/");
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    async function loadBootstrap() {
      try {
        const data = await api("/bootstrap");
        setBoot(data);
      } catch (error) {
        setToast(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadBootstrap();
  }, []);

  useEffect(() => {
    if (!session.token) return;
    (async () => {
      try {
        const data = await api("/me", { token: session.token });
        setSession((current) => ({ ...current, token: session.token, ...data }));
        localStorage.setItem("zanee-token", session.token);
      } catch {
        localStorage.removeItem("zanee-token");
        setSession({ token: "", user: null, favorites: [], cart: [], orders: [] });
      }
    })();
  }, [session.token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (session.user?.isLocked && route.name !== "blocked") {
      goTo("/blocked");
    }
  }, [session.user?.isLocked, route.name]);

  async function refreshMe(token = session.token) {
    if (!token) return;
    const data = await api("/me", { token });
    setSession((current) => ({ ...current, token, ...data }));
    localStorage.setItem("zanee-token", token);
  }

  function requireLogin(featureName) {
    setToast(`Ban can dang nhap de su dung chuc nang ${featureName}.`);
    setAuthMode("login");
    goTo("/auth");
  }

  function handleLogout() {
    localStorage.removeItem("zanee-token");
    setSession({ token: "", user: null, favorites: [], cart: [], orders: [] });
    setToast("Da dang xuat.");
    goTo("/");
  }

  function handleSearchSubmit() {
    setSelectedCategory("");
    goTo("/");
  }

  async function handleAuth(type, payload) {
    try {
      const endpoint = type === "login" ? "/auth/login" : "/auth/register";
      const data = await api(endpoint, { method: "POST", body: payload });
      setSession((current) => ({ ...current, token: data.token, user: data.user }));
      setToast(type === "login" ? "Dang nhap thanh cong." : "Dang ky thanh cong.");
      await refreshMe(data.token);
      if (data.user.isLocked) {
        goTo("/blocked");
      } else {
        goTo("/");
      }
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleResetPassword(payload) {
    try {
      const data = await api("/auth/reset-password", { method: "POST", body: payload });
      setToast(data.message);
      setAuthMode("login");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleFavorite(productId) {
    if (!session.user) return requireLogin("luu yeu thich");
    if (session.user.role !== "user") return setToast("Tai khoan admin khong dung duoc muc yeu thich.");
    try {
      await api(`/favorites/${productId}`, { method: "POST", token: session.token });
      await refreshMe();
      setToast("Da cap nhat danh sach yeu thich.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleAddToCart(productId, buyNow = false) {
    if (!session.user) return requireLogin("them vao gio hang");
    if (session.user.role !== "user") return setToast("Tai khoan admin khong the dat hang.");
    try {
      await api("/cart", { method: "POST", token: session.token, body: { productId, quantity: 1 } });
      await refreshMe();
      setToast(buyNow ? "San pham da duoc them va chuyen toi gio hang." : "Da them vao gio hang.");
      if (buyNow) goTo("/cart");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleQuantity(productId, quantity) {
    try {
      await api(`/cart/${productId}`, { method: "PATCH", token: session.token, body: { quantity } });
      await refreshMe();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleRemove(productId) {
    try {
      await api(`/cart/${productId}`, { method: "DELETE", token: session.token });
      await refreshMe();
      setToast("Da xoa san pham khoi gio hang.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleCheckout(payload) {
    try {
      const data = await api("/orders", { method: "POST", token: session.token, body: payload });
      await refreshMe();
      setToast(data.message);
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank", "noopener,noreferrer");
      }
      goTo(`/orders/${data.order.id}`);
    } catch (error) {
      setToast(error.message);
    }
  }

  const filteredProducts = useMemo(() => {
    return boot.products.filter((product) => {
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [boot.products, search, selectedCategory]);

  const routeDenied = USER_ONLY_ROUTES.includes(route.name) && session.user && session.user.role !== "user";
  const orderDetail = route.name === "orders" && route.id ? session.orders.find((order) => order.id === route.id) : null;

  let content = null;
  if (loading) {
    content = <ScreenCard title="Dang tai du lieu store" text="He thong dang nap danh sach san pham va thong tin demo." />;
  } else if (route.name === "blocked") {
    content = <ScreenCard title="Tai khoan da bi khoa" text="Vui long lien he hotline 0909954360 de duoc ho tro." />;
  } else if (routeDenied) {
    content = <ScreenCard title="403" text="Tai khoan hien tai khong co quyen truy cap tinh nang dat hang." />;
  } else {
    switch (route.name) {
      case "product":
        content = (
          <ProductDetail
            product={boot.products.find((item) => item.id === route.id)}
            onCart={(id) => handleAddToCart(id)}
            onBuy={(id) => handleAddToCart(id, true)}
            onFavorite={handleFavorite}
            isFavorite={session.favorites.some((item) => item.id === route.id)}
          />
        );
        break;
      case "auth":
        content = (
          <AuthPage
            mode={authMode}
            setMode={setAuthMode}
            onLogin={(payload) => handleAuth("login", payload)}
            onRegister={(payload) => handleAuth("register", payload)}
            onReset={handleResetPassword}
            credentialsHint={boot.credentialsHint}
          />
        );
        break;
      case "cart":
        content = session.user ? (
          <CartPage cart={session.cart} onQuantity={handleQuantity} onRemove={handleRemove} onCheckout={handleCheckout} />
        ) : (
          <ScreenCard title="Can dang nhap" text="Ban can dang nhap de xem gio hang." />
        );
        break;
      case "favorites":
        content = session.user ? (
          <FavoritesPage favorites={session.favorites} onDetail={(id) => goTo(`/product/${id}`)} />
        ) : (
          <ScreenCard title="Can dang nhap" text="Ban can dang nhap de xem danh sach yeu thich." />
        );
        break;
      case "orders":
        content = session.user ? (
          route.id ? (
            <OrderDetailPage order={orderDetail} />
          ) : (
            <OrdersPage orders={session.orders} onDetail={(id) => goTo(`/orders/${id}`)} />
          )
        ) : (
          <ScreenCard title="Can dang nhap" text="Ban can dang nhap de xem don hang." />
        );
        break;
      default:
        content = (
          <HomePage
            products={filteredProducts}
            categories={boot.categories}
            selectedCategory={selectedCategory}
            setCategory={setSelectedCategory}
            session={session}
            featured={boot.featured}
            handlers={{
              onDetail: (id) => goTo(`/product/${id}`),
              onFavorite: handleFavorite,
              onCart: (id) => handleAddToCart(id),
              onBuy: (id) => handleAddToCart(id, true),
              favorites: session.favorites.map((item) => item.id),
            }}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      <Header
        products={boot.products}
        search={search}
        setSearch={setSearch}
        session={session}
        cartCount={session.cart.reduce((sum, item) => sum + item.quantity, 0)}
        favoritesCount={session.favorites.length}
        onLogout={handleLogout}
        onSearchSubmit={handleSearchSubmit}
      />
      <main className="container py-4">{content}</main>
      <Footer />
      {toast && <div className="toast-note">{toast}</div>}
    </div>
  );
}

export default App;
