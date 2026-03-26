import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000/api";
const PURPOSE_OPTIONS = [
  { value: "office", label: "Công việc văn phòng" },
  { value: "basicGaming", label: "Chơi game cơ bản" },
  { value: "heavyGaming", label: "Chơi game đồ họa nặng" },
  { value: "it", label: "Công việc IT" },
  { value: "content", label: "Sử dụng thường xuyên cho MXH, TikTok, Meta, YouTube" },
];

const GUIDE_POSTS = [
  {
    id: "smart-builder-huong-dan",
    title: "Cách dùng Build PC thông minh để có cấu hình sát ngân sách",
    excerpt:
      "Hướng dẫn chi tiết từng bước sử dụng tính năng Build PC thông minh trên Zanee.Store, từ chọn mục tiêu đến kiểm tra linh kiện.",
    cover: "https://picsum.photos/seed/zanee-guide-builder-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-builder-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-builder-2/1200/700",
    ],
    hashtags: "#BuildPC #SmartBuilder #ZaneeStore #HuongDanCongNghe",
    paragraphs: [
      "Nếu bạn từng bối rối giữa quá nhiều lựa chọn CPU, VGA, RAM và không biết bắt đầu từ đâu, thì Build PC thông minh chính là lối tắt cực kỳ hữu ích. Bạn chỉ cần chọn ngân sách và mục đích sử dụng, hệ thống sẽ tự đề xuất bộ linh kiện cân bằng hiệu năng - chi phí.",
      "Bước 1: vào mục Build PC thông minh trên thanh header. Bước 2: nhập ngân sách thực tế bạn muốn chi, ví dụ 20 triệu hoặc 25 triệu. Bước 3: tick đúng mục đích sử dụng như văn phòng, gaming cơ bản, gaming nặng hoặc IT. Mẹo nhỏ: chọn nhiều mục đích nếu bạn làm đa tác vụ.",
      "Sau khi bấm dựng cấu hình, hệ thống tự thêm các linh kiện phù hợp vào giỏ hàng để bạn review nhanh. Đây là điểm mạnh vì bạn không phải chọn thủ công từng món, đồng thời vẫn có thể chỉnh sửa số lượng hoặc thay thế linh kiện trước khi thanh toán.",
      "Trước khi chốt đơn, bạn nên kiểm tra 3 thứ: tổng tiền có vượt ngân sách không, công suất nguồn có dư cho nâng cấp không, và chính sách bảo hành từng linh kiện. Chỉ cần làm đủ 3 bước này là bạn đã tránh được hầu hết lỗi build thiếu cân bằng thường gặp ở người mới.",
    ],
  },
  {
    id: "ram-ssd-toi-uu",
    title: "Nâng cấp RAM và SSD: Cách tăng tốc máy rõ rệt với chi phí hợp lý",
    excerpt:
      "Một bài viết dễ hiểu giúp bạn quyết định nên nâng RAM hay SSD trước, phù hợp cho sinh viên, dân văn phòng và người làm sáng tạo.",
    cover: "https://picsum.photos/seed/zanee-guide-ramssd-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-ramssd-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-ramssd-2/1200/700",
    ],
    hashtags: "#RAM #SSD #TangTocMayTinh #TechTips",
    paragraphs: [
      "Post này dành cho bạn nào đang dùng máy mở nhiều tab là lag, bật Photoshop thì chậm, hoặc khởi động Windows mất quá nhiều thời gian. Tin vui là không cần đổi cả máy, chỉ cần nâng cấp đúng điểm nghẽn là hiệu năng cải thiện rất rõ.",
      "Nếu máy đang có HDD, ưu tiên số 1 luôn là lên SSD. Chỉ riêng thay ổ khởi động sang SSD cũng giúp tốc độ mở máy, mở phần mềm và phản hồi hệ thống nhanh hơn đáng kể. Còn nếu bạn đã có SSD mà đa nhiệm vẫn ì ạch, lúc đó hãy tăng RAM.",
      "Mốc tham khảo dễ nhớ: 8GB phù hợp tác vụ nhẹ, 16GB là mức cân bằng cho phần lớn người dùng, 32GB dành cho dựng video, lập trình nặng hoặc chạy máy ảo. Đừng quên kiểm tra mainboard hỗ trợ bus RAM bao nhiêu để mua đúng chuẩn.",
      "Kết luận nhanh kiểu Facebook: thiếu tốc độ truy xuất thì nâng SSD trước, thiếu không gian xử lý đa tác vụ thì nâng RAM trước. Làm đúng thứ tự này sẽ tối ưu được cả tiền lẫn trải nghiệm sử dụng hàng ngày.",
    ],
  },
  {
    id: "wifi-van-phong-on-dinh",
    title: "Tối ưu Wi-Fi và mạng nội bộ cho văn phòng nhỏ không cần thiết bị đắt",
    excerpt:
      "Checklist thực tế để cải thiện mạng chập chờn trong văn phòng 10-30 người, họp online ổn định và giảm rớt kết nối.",
    cover: "https://picsum.photos/seed/zanee-guide-wifi-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-wifi-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-wifi-2/1200/700",
    ],
    hashtags: "#WiFiVanPhong #Networking #ITSupport #CongNghe",
    paragraphs: [
      "Nhiều văn phòng cứ tưởng mạng yếu là do gói cước thấp, nhưng thực tế phần lớn đến từ vị trí đặt router, nhiễu kênh và thiếu phân lớp thiết bị. Bạn không cần đầu tư quá lớn ngay từ đầu nếu tối ưu đúng các bước cơ bản.",
      "Đầu tiên, đặt router ở khu vực trung tâm và cao hơn mặt bàn làm việc. Tránh đặt sát tường bê tông hoặc gần thiết bị gây nhiễu như lò vi sóng, loa Bluetooth công suất lớn. Sau đó tách riêng băng tần 2.4GHz cho IoT và 5GHz cho laptop/điện thoại làm việc.",
      "Tiếp theo, dùng switch có quản lý cơ bản để chia VLAN theo nhu cầu: máy nội bộ, camera, khách. Cách này giúp mạng ổn định hơn và bảo mật tốt hơn. Với phòng họp online, luôn ưu tiên dây LAN cho máy trình chiếu hoặc mini PC hội nghị.",
      "Nếu đội ngũ tăng nhanh, hãy lên kế hoạch mesh hoặc thêm access point theo sơ đồ mặt bằng, đừng vá chắp từng điểm. Một thiết kế mạng gọn ngay từ đầu sẽ giúp bạn tiết kiệm rất nhiều công sức vận hành về sau.",
    ],
  },
  {
    id: "bao-mat-tai-khoan-doanh-nghiep",
    title: "5 lớp bảo mật tài khoản doanh nghiệp ai cũng làm được",
    excerpt:
      "Bài viết dạng chia sẻ nhanh: từ mật khẩu, 2FA, phân quyền tới thói quen an toàn giúp giảm rủi ro bị chiếm tài khoản.",
    cover: "https://picsum.photos/seed/zanee-guide-security-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-security-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-security-2/1200/700",
    ],
    hashtags: "#CyberSecurity #2FA #BaoMatTaiKhoan #ITAwareness",
    paragraphs: [
      "Bảo mật không phải câu chuyện chỉ của đội IT. Trong doanh nghiệp nhỏ, chỉ cần 1 tài khoản bị lộ là có thể kéo theo hàng loạt rủi ro về dữ liệu khách hàng, email nội bộ và hóa đơn.",
      "Lớp 1 là mật khẩu mạnh và khác nhau giữa các dịch vụ. Lớp 2 là bật xác thực hai bước cho toàn bộ tài khoản quan trọng. Lớp 3 là phân quyền theo vai trò, không cấp quyền admin tràn lan chỉ vì tiện.",
      "Lớp 4 là cảnh báo đăng nhập bất thường qua email hoặc ứng dụng. Lớp 5 là đào tạo nhận diện phishing định kỳ, đặc biệt với nhân sự xử lý thanh toán. Chỉ cần 15 phút nhắc lại mỗi tháng đã giảm đáng kể nguy cơ bấm nhầm link giả mạo.",
      "Đây là kiểu đầu tư ít tốn chi phí nhưng hiệu quả lâu dài. Bạn càng chuẩn hóa sớm, đội ngũ càng yên tâm làm việc và ít phải chữa cháy khi sự cố xảy ra.",
    ],
  },
  {
    id: "ai-tools-nang-suat",
    title: "AI tools cho dân văn phòng và dev: dùng thế nào để tăng năng suất thật",
    excerpt:
      "Tổng hợp workflow thực dụng khi dùng AI: viết email, tóm tắt tài liệu, tạo checklist và hỗ trợ coding có kiểm soát.",
    cover: "https://picsum.photos/seed/zanee-guide-ai-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-ai-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-ai-2/1200/700",
    ],
    hashtags: "#AITools #Productivity #DeveloperLife #WorkSmarter",
    paragraphs: [
      "AI không thay thế tư duy chuyên môn, nhưng giúp bạn tiết kiệm rất nhiều thời gian ở các việc lặp lại. Bí quyết là dùng AI cho phần nháp đầu tiên, còn phần quyết định cuối cùng vẫn phải do người chịu trách nhiệm kiểm tra.",
      "Với dân văn phòng, AI phù hợp để tóm tắt biên bản họp, tạo dàn ý proposal, chuẩn hóa email trả lời khách hàng. Với dev, AI hỗ trợ giải thích code legacy, gợi ý test case, và tạo skeleton tài liệu kỹ thuật nhanh hơn.",
      "Quy tắc 3 bước nên áp dụng: đưa ngữ cảnh rõ, yêu cầu output theo format cụ thể, và tự review trước khi publish. Nếu bỏ qua bước review, bạn dễ gặp lỗi sai ngữ nghĩa hoặc thông tin chưa chính xác.",
      "Khi team cùng dùng AI theo một template prompt chuẩn, chất lượng đầu ra sẽ ổn định hơn và dễ bàn giao. Đây là cách biến AI thành công cụ hỗ trợ hệ thống thay vì chỉ là tiện ích cá nhân.",
    ],
  },
  {
    id: "backup-du-lieu-321",
    title: "Quy tắc backup 3-2-1: Cứu dữ liệu trước khi quá muộn",
    excerpt:
      "Một bài hướng dẫn thực chiến về sao lưu dữ liệu cho cá nhân và doanh nghiệp nhỏ, dễ áp dụng ngay trong tuần này.",
    cover: "https://picsum.photos/seed/zanee-guide-backup-cover/1200/700",
    images: [
      "https://picsum.photos/seed/zanee-guide-backup-1/1200/700",
      "https://picsum.photos/seed/zanee-guide-backup-2/1200/700",
    ],
    hashtags: "#Backup321 #DataSafety #ITOps #DisasterRecovery",
    paragraphs: [
      "Mất dữ liệu không báo trước. Có thể do ổ cứng lỗi, ransomware, thao tác nhầm hoặc đơn giản là máy hỏng đột ngột. Vì vậy backup không phải việc để khi rảnh mới làm, mà là quy trình bắt buộc.",
      "Quy tắc 3-2-1 rất dễ nhớ: giữ 3 bản dữ liệu, trên 2 loại thiết bị khác nhau, và 1 bản ở ngoài site (cloud hoặc vị trí vật lý khác). Chỉ cần bám đúng nguyên tắc này là khả năng phục hồi đã tăng mạnh.",
      "Bạn có thể triển khai theo mức cơ bản: dữ liệu gốc trên máy làm việc, bản sao trên ổ NAS hoặc ổ cứng rời, thêm một bản cloud tự động đồng bộ theo lịch. Định kỳ mỗi tháng nên thử khôi phục mẫu để chắc chắn backup dùng được thật.",
      "Đừng đợi sự cố mới làm backup. Hãy xem đó là một phần của văn hóa vận hành chuyên nghiệp, giống như việc khóa cửa trước khi rời văn phòng.",
    ],
  },
];

const ADMIN_ROUTES = ["admin"];
const USER_ONLY_ROUTES = ["cart", "favorites", "orders", "builder"];

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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API.");
  }
  return data;
}

function ProductCard({ product, onDetail, onFavorite, onCart, onBuy, isFavorite, role }) {
  return (
    <div className="col-4 col-md-6 col-xl-3">
      <div className="product-card h-100">
        <div className="product-image-wrap">
          <img className="product-image" src={product.image} alt={product.name} />
        </div>
        <div className="product-meta">
          <span className="badge rounded-pill text-bg-primary">{product.category}</span>
          <span className="small text-secondary">BH {product.warrantyMonths} tháng</span>
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
              Chi tiết
            </button>
            <button
              className={`btn btn-sm ${isFavorite ? "btn-info" : "btn-outline-info"}`}
              onClick={() => onFavorite(product.id)}
              title="Yêu thích"
            >
              <i className="bi bi-heart-fill" />
            </button>
          </div>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-outline-primary flex-fill" onClick={() => onCart(product.id)}>
            {role === "admin" ? "Không áp dụng" : "Thêm vào giỏ"}
          </button>
          <button className="btn btn-primary flex-fill" onClick={() => onBuy(product.id)}>
            {role === "admin" ? "Không áp dụng" : "Mua ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({
  products,
  search,
  setSearch,
  session,
  cartCount,
  favoritesCount,
  onLogout,
  onSearchSubmit,
}) {
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return products
      .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 5);
  }, [products, search]);

  const isAdmin = session.user?.role === "admin";

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
          <button type="submit" className="search-submit-btn" aria-label="Tìm kiếm sản phẩm">
            <i className="bi bi-search" />
          </button>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm máy tính, RAM, VGA, laptop..."
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
          {!isAdmin && (
            <>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/guide")}>
                Cẩm nang
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/builder")}>
                Build PC thông minh
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/favorites")}>
                <i className="bi bi-heart" /> {favoritesCount}
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/cart")}>
                <i className="bi bi-cart3" /> {cartCount}
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/orders")}>
                Hóa đơn
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <button className="btn btn-outline-info btn-sm" onClick={() => goTo("/admin")}>
                Danh mục quản trị
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/account")}>
                Tài khoản
              </button>
            </>
          )}
          {!session.user ? (
            <button className="btn btn-primary btn-sm" onClick={() => goTo("/auth")}>
              Đăng nhập / Đăng ký
            </button>
          ) : (
            <>
              {!isAdmin && (
                <button className="btn btn-outline-light btn-sm" onClick={() => goTo("/account")}>
                  {session.user.username}
                </button>
              )}
              <button className="btn btn-sm btn-info" onClick={onLogout}>
                Đăng xuất
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
        <span className="eyebrow">PC STORE | THIÊN ĐƯỜNG CÔNG NGHỆ</span>
        <h1>Nâng cấp góc máy của bạn với Zanee.Store</h1>
        <p>
          Từ RAM, SSD, VGA đến laptop và màn hình gaming, mọi cấu hình đều được chuẩn hóa cho đồ án
          bán hàng công nghệ với trải nghiệm mượt, hiện đại và dễ mở rộng.
        </p>
        <div className="d-flex gap-2 flex-wrap mt-4">
          <button className="btn btn-primary" onClick={() => goTo("/builder")}>
            Dựng PC thông minh
          </button>
          <button className="btn btn-outline-light" onClick={() => goTo("/auth")}>
            Tạo tài khoản ngay
          </button>
        </div>
      </div>
      <div className="hero-card-grid">
        <div className="floating-card">
          <strong>{products.length}+</strong>
          <span>Sản phẩm công nghệ</span>
        </div>
        <div className="floating-card">
          <strong>{categories.length}</strong>
          <span>Danh mục linh kiện</span>
        </div>
        <div className="floating-card full">
          <strong>0909954360</strong>
          <span> - Hotline hỗ trợ đơn hàng, khóa tài khoản và tư vấn cấu hình</span>
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
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return products.slice(startIndex, startIndex + productsPerPage);
  }, [currentPage, products]);

  useEffect(() => {
    setCurrentPage(1);
  }, [products.length, selectedCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="page-shell">
      <Hero products={products} categories={categories} onCategory={setCategory} />
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Danh sách sản phẩm</span>
            <h2>Tất cả mặt hàng công nghệ</h2>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn btn-sm ${!selectedCategory ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setCategory("")}
            >
              Tất cả
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
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDetail={handlers.onDetail}
              onFavorite={handlers.onFavorite}
              onCart={handlers.onCart}
              onBuy={handlers.onBuy}
              isFavorite={handlers.favorites.includes(product.id)}
              role={session.user?.role}
            />
          ))}
        </div>
        <div className="pagination-shell">
          <button
            className="btn btn-outline-light btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Trước
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              className={`btn btn-sm ${page === currentPage ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="btn btn-outline-light btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Sau
          </button>
        </div>
      </section>
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Nổi bật</span>
            <h2>Gợi ý cấu hình hot tại store</h2>
          </div>
        </div>
        <div className="row g-4">
          {featured.map((item) => (
            <div className="col-lg-3 col-md-6" key={item.id}>
              <div className="feature-card">
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
    return <ScreenCard title="Không tìm thấy sản phẩm" text="Sản phẩm bạn chọn không tồn tại hoặc đã bị xóa." />;
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
              <span>Giá niêm yết</span>
              <strong>{currency(product.price)}</strong>
            </div>
            <div>
              <span>Bảo hành</span>
              <strong>{product.warrantyMonths} tháng</strong>
            </div>
            <div>
              <span>Mã SKU</span>
              <strong>{product.sku}</strong>
            </div>
            <div>
              <span>Tồn kho</span>
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
              {isFavorite ? "Đã lưu yêu thích" : "Lưu vào yêu thích"}
            </button>
            <button className="btn btn-outline-light" onClick={() => onCart(product.id)}>
              Thêm vào giỏ
            </button>
            <button className="btn btn-primary" onClick={() => onBuy(product.id)}>
              Mua ngay
            </button>
          </div>
        </div>
        <div className="side-info">
          <div className="feature-card">
            <h3>Cam kết tại Zanee.Store</h3>
            <p>Hàng chính hãng, bảo hành theo giá trị sản phẩm 3-6-9-12 tháng, hỗ trợ dựng cấu hình phù hợp ngân sách.</p>
            <p>Địa chỉ: 161 Nguyễn Gia Trí, Bình Thạnh</p>
            <p>Hotline: 0909954360</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthPage({ mode, setMode, onLogin, onRegister, onReset }) {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", phone: "", password: "" });
  const [resetForm, setResetForm] = useState({ username: "", phone: "", newPassword: "" });

  return (
    <div className="page-shell">
      <section className="auth-layout">
        <div className="glass-panel">
          <div className="auth-banner-wrap">
            <img className="auth-banner-image" src="/banner.png" alt="Zanee Store banner" />
          </div>
        </div>
        <div className="glass-panel">
          <div className="auth-form-shell">
            <span className="eyebrow">Tài khoản Zanee.Store</span>
            <h2 className="auth-welcome">Chào mừng bạn đã quay lại Zanee.Store!</h2>
            <p className="auth-subtext">Đăng nhập để tiếp tục mua sắm, quản lý đơn hàng và theo dõi cấu hình yêu thích của bạn.</p>
          </div>
          {mode === "login" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onLogin(loginForm); }}>
              <input className="form-control" placeholder="Username" value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              <input className="form-control" type="password" placeholder="Password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              <div className="auth-action-row">
                <button className="btn btn-primary auth-submit-btn">Đăng nhập</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("register")}>
                  Bạn chưa có tài khoản? Đăng ký ngay!
                </button>
              </div>
              <button type="button" className="btn btn-link auth-forgot-link" onClick={() => setMode("reset")}>
                Quên mật khẩu
              </button>
            </form>
          )}
          {mode === "register" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onRegister(registerForm); }}>
              <input className="form-control" placeholder="Username" value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} />
              <input className="form-control" placeholder="Email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} />
              <input className="form-control" placeholder="Số điện thoại" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} />
              <input className="form-control" type="password" placeholder="Mật khẩu" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} />
              <div className="auth-action-row auth-tabs-bottom">
                <button className="btn btn-primary auth-submit-btn">Tạo tài khoản user</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("login")}>
                  Đã có tài khoản? Đăng nhập ngay!
                </button>
              </div>
              <button type="button" className="btn btn-link auth-forgot-link" onClick={() => setMode("reset")}>
                Quên mật khẩu
              </button>
            </form>
          )}
          {mode === "reset" && (
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onReset(resetForm); }}>
              <input className="form-control" placeholder="Username đã đăng ký" value={resetForm.username} onChange={(event) => setResetForm({ ...resetForm, username: event.target.value })} />
              <input className="form-control" placeholder="Số điện thoại đã đăng ký" value={resetForm.phone} onChange={(event) => setResetForm({ ...resetForm, phone: event.target.value })} />
              <input className="form-control" type="password" placeholder="Mật khẩu mới" value={resetForm.newPassword} onChange={(event) => setResetForm({ ...resetForm, newPassword: event.target.value })} />
              <div className="auth-action-row auth-tabs-bottom">
                <button className="btn btn-primary auth-submit-btn">Đặt lại mật khẩu</button>
                <button type="button" className="btn btn-link auth-inline-link" onClick={() => setMode("login")}>
                  Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
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

function BuilderPage({ onBuild, lastBuild }) {
  const [budget, setBudget] = useState(25000000);
  const [purpose, setPurpose] = useState(["office"]);

  function togglePurpose(value) {
    setPurpose((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <div className="page-shell">
      <section className="auth-layout">
        <div className="glass-panel">
          <span className="eyebrow">Smart Builder</span>
          <h2>Dựng cấu hình PC thông minh</h2>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onBuild({ budget, purpose }); }}>
            <input className="form-control" type="number" value={budget} onChange={(event) => setBudget(event.target.value)} />
            <div className="check-grid">
              {PURPOSE_OPTIONS.map((option) => (
                <label key={option.value} className="check-item">
                  <input type="checkbox" checked={purpose.includes(option.value)} onChange={() => togglePurpose(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary">Tự động thêm vào giỏ hàng</button>
          </form>
        </div>
        <div className="glass-panel">
          <h2>Kết quả build gần nhất</h2>
          {!lastBuild ? (
            <p>Chưa có cấu hình nào được dựng. Hệ thống sẽ tự chọn linh kiện xấp xỉ ngân sách và đưa vào giỏ hàng.</p>
          ) : (
            <>
              <div className="detail-grid">
                <div><span>Tổng cấu hình</span><strong>{currency(lastBuild.total)}</strong></div>
                <div><span>Chênh lệch</span><strong>{currency(lastBuild.delta)}</strong></div>
              </div>
              <ul className="spec-list mt-4">
                {lastBuild.items.map((item) => (
                  <li key={item.id}>{item.category}: {item.name} - {currency(item.price)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function GuidePage({ posts }) {
  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Cẩm nang công nghệ</span>
            <h2>6 blog IT nổi bật cho người mới và người đi làm</h2>
          </div>
        </div>
        <p className="mb-4">Nội dung được viết theo phong cách gần gũi như một bài post Facebook: dễ đọc, thực tế và có thể áp dụng ngay.</p>
        <div className="row g-4">
          {posts.map((post) => (
            <div className="col-md-6 col-xl-4" key={post.id}>
              <article className="feature-card h-100">
                <div className="feature-image-wrap mb-3">
                  <img className="feature-image" src={post.cover} alt={post.title} />
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <p className="small text-info">{post.hashtags}</p>
                <button className="btn btn-outline-light mt-2" onClick={() => goTo(`/guide/${post.id}`)}>
                  Đọc bài chi tiết
                </button>
              </article>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GuideDetailPage({ post }) {
  if (!post) {
    return <ScreenCard title="Không tìm thấy bài viết" text="Bài cẩm nang không tồn tại hoặc đã bị di chuyển." />;
  }

  return (
    <div className="page-shell">
      <section className="section-block">
        <span className="eyebrow">Cẩm nang | Blog chi tiết</span>
        <h1>{post.title}</h1>
        <p className="small text-info mb-4">{post.hashtags}</p>

        <div className="detail-image-wrap mb-4">
          <img className="detail-image" src={post.cover} alt={post.title} />
        </div>

        <div>
          {post.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="row g-4 mt-1">
          {post.images.map((image, index) => (
            <div className="col-md-6" key={image}>
              <div className="detail-image-wrap">
                <img className="detail-image" src={image} alt={`${post.title} minh họa ${index + 1}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2 flex-wrap mt-4">
          <button className="btn btn-outline-light" onClick={() => goTo("/guide")}>
            Quay lại Cẩm nang
          </button>
          <button className="btn btn-primary" onClick={() => goTo("/")}>
            Về trang chủ
          </button>
        </div>
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
          <div><span className="eyebrow">Giỏ hàng</span><h2>Xác nhận mặt hàng</h2></div>
        </div>
        {!cart.length ? (
          <ScreenCard title="Giỏ hàng đang trống" text="Hãy thêm linh kiện hoặc dùng tính năng build PC để tự động tạo cấu hình." />
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
                  <button className="btn btn-outline-danger btn-sm" onClick={() => onRemove(item.productId)}>Xóa</button>
                </div>
              ))}
            </div>
            <div className="glass-panel">
              <h3>Thanh toán</h3>
              <div className="check-grid">
                <label className="check-item"><input type="radio" checked={fulfillmentMethod === "pickup"} onChange={() => setFulfillmentMethod("pickup")} /> <span>Nhận tại store vào hôm sau</span></label>
                <label className="check-item"><input type="radio" checked={fulfillmentMethod === "delivery"} onChange={() => setFulfillmentMethod("delivery")} /> <span>Giao tại nhà (+30.000đ)</span></label>
              </div>
              {fulfillmentMethod === "delivery" && (
                <input className="form-control mt-3" placeholder="Địa chỉ nhận hàng" value={address} onChange={(event) => setAddress(event.target.value)} />
              )}
              <div className="check-grid mt-3">
                <label className="check-item"><input type="radio" checked={paymentMethod === "pickup"} onChange={() => setPaymentMethod("pickup")} /> <span>Nhận hàng tại store</span></label>
                <label className="check-item"><input type="radio" checked={paymentMethod === "delivery"} onChange={() => setPaymentMethod("delivery")} /> <span>Thanh toán khi giao hàng</span></label>
                <label className="check-item"><input type="radio" checked={paymentMethod === "vnpay"} onChange={() => setPaymentMethod("vnpay")} /> <span>VNPAY sandbox</span></label>
              </div>
              <div className="detail-grid mt-4">
                <div><span>Tạm tính</span><strong>{currency(subtotal)}</strong></div>
                <div><span>Phí ship</span><strong>{currency(shipping)}</strong></div>
                <div><span>Tổng thanh toán</span><strong>{currency(total)}</strong></div>
              </div>
              <button className="btn btn-primary w-100 mt-4" onClick={() => onCheckout({ fulfillmentMethod, paymentMethod, address })}>
                Mua ngay
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
          <div><span className="eyebrow">Yêu thích</span><h2>Sản phẩm đã lưu</h2></div>
        </div>
        <div className="row g-4">
          {favorites.map((item) => (
            <div className="col-md-6 col-xl-4" key={item.id}>
              <div className="feature-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <strong>{currency(item.price)}</strong>
                <button className="btn btn-outline-light mt-3" onClick={() => onDetail(item.id)}>Xem chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function OrdersPage({ orders }) {
  const pickupOrder = orders.find((item) => item.fulfillmentMethod === "pickup");
  const [liveEta, setLiveEta] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!pickupOrder || !window.EventSource) return undefined;
    const token = localStorage.getItem("zanee-token");
    const eventSource = new EventSource(`${API_BASE}/orders/${pickupOrder.id}/stream?token=${token}`);
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setLiveEta(payload);
    };
    eventSource.onerror = () => eventSource.close();
    return () => eventSource.close();
  }, [pickupOrder]);

  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="section-head">
          <div><span className="eyebrow">Hóa đơn</span><h2>Lịch sử mua hàng</h2></div>
        </div>
        {!orders.length ? (
          <ScreenCard title="Chưa có hóa đơn" text="Sau khi thanh toán thành công, hóa đơn sẽ được lưu trong mục này." />
        ) : (
          <div className="row g-4">
            {orders.map((order) => (
              <div className="col-lg-6" key={order.id}>
                <div className="feature-card">
                  <div className="d-flex justify-content-between gap-3 flex-wrap">
                    <strong>{order.id}</strong>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <p>{order.status}</p>
                  <p>Tổng tiền: <strong>{currency(order.total)}</strong></p>
                  <p>Phương thức: {order.paymentMethod} | Hình thức nhận: {order.fulfillmentMethod}</p>
                  {pickupOrder?.id === order.id && liveEta && (
                    <p className="text-info">Realtime pickup: còn khoảng {liveEta.etaMinutes} phút tới thời điểm nhận vào ngày hôm sau.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AccountPage({ user, onChangePassword }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });

  return (
    <div className="page-shell">
      <section className="auth-layout">
        <div className="glass-panel">
          <span className="eyebrow">Thông tin tài khoản</span>
          <h2>{user.username}</h2>
          <div className="detail-grid">
            <div><span>Email</span><strong>{user.email}</strong></div>
            <div><span>Số điện thoại</span><strong>{user.phone}</strong></div>
            <div><span>Role</span><strong>{user.role}</strong></div>
            <div><span>Ngày tạo</span><strong>{formatDate(user.createdAt)}</strong></div>
            <div><span>Mật khẩu</span><strong>••••••••</strong></div>
          </div>
        </div>
        <div className="glass-panel">
          <h2>Đổi mật khẩu</h2>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onChangePassword(form); }}>
            <input className="form-control" type="password" placeholder="Mật khẩu hiện tại" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} />
            <input className="form-control" type="password" placeholder="Mật khẩu mới" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
            <button className="btn btn-primary">Cập nhật mật khẩu</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function AdminPage({
  adminStats,
  adminUsers,
  adminOrders,
  categories,
  products,
  onToggleLock,
  onSaveProduct,
  onDeleteProduct,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
}) {
  const [tab, setTab] = useState("stats");
  const [adminProductPage, setAdminProductPage] = useState(1);
  const adminProductsPerPage = 10;
  const [draft, setDraft] = useState({
    name: "",
    category: categories[0] || "",
    price: 0,
    warrantyMonths: 6,
    stock: 1,
    image: "",
    description: "",
    specs: "",
  });
  const [rename, setRename] = useState({});
  const [newCategory, setNewCategory] = useState("");
  const adminTotalPages = Math.max(1, Math.ceil(products.length / adminProductsPerPage));
  const adminPaginatedProducts = useMemo(() => {
    const startIndex = (adminProductPage - 1) * adminProductsPerPage;
    return products.slice(startIndex, startIndex + adminProductsPerPage);
  }, [adminProductPage, products]);

  useEffect(() => {
    if (tab === "products") {
      setAdminProductPage(1);
    }
  }, [tab]);

  useEffect(() => {
    if (adminProductPage > adminTotalPages) {
      setAdminProductPage(adminTotalPages);
    }
  }, [adminProductPage, adminTotalPages]);

  return (
    <div className="page-shell">
      <section className="section-block">
        <div className="d-flex gap-2 flex-wrap mb-4">
          {["stats", "products", "categories", "orders", "users"].map((item) => (
            <button key={item} className={`btn ${tab === item ? "btn-primary" : "btn-outline-light"}`} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <div className="row g-4">
            {[
              ["Người dùng", adminStats.totalUsers],
              ["Admin", adminStats.totalAdmins],
              ["Sản phẩm", adminStats.totalProducts],
              ["Đơn hàng", adminStats.totalOrders],
              ["Doanh thu", currency(adminStats.totalRevenue)],
            ].map(([label, value]) => (
              <div className="col-md-4" key={label}>
                <div className="feature-card">
                  <span className="eyebrow">{label}</span>
                  <h2>{value}</h2>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "products" && (
          <div className="auth-layout">
            <div className="glass-panel">
              <h3>Thêm hoặc cập nhật sản phẩm</h3>
              <form className="form-grid" onSubmit={(event) => {
                event.preventDefault();
                onSaveProduct({
                  ...draft,
                  specs: draft.specs.split(",").map((item) => item.trim()).filter(Boolean),
                });
                setDraft({
                  name: "",
                  category: categories[0] || "",
                  price: 0,
                  warrantyMonths: 6,
                  stock: 1,
                  image: "",
                  description: "",
                  specs: "",
                });
              }}>
                <input className="form-control" placeholder="Tên sản phẩm" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                <select className="form-select" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
                <input className="form-control" type="number" placeholder="Giá" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
                <input className="form-control" type="number" placeholder="Bảo hành" value={draft.warrantyMonths} onChange={(event) => setDraft({ ...draft, warrantyMonths: event.target.value })} />
                <input className="form-control" type="number" placeholder="Tồn kho" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} />
                <input className="form-control" placeholder="URL hình ảnh sản phẩm" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} />
                <textarea className="form-control" rows="3" placeholder="Mô tả" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                <input className="form-control" placeholder="Specs, ngăn cách bằng dấu phẩy" value={draft.specs} onChange={(event) => setDraft({ ...draft, specs: event.target.value })} />
                {draft.image && (
                  <div className="admin-preview-wrap">
                    <img className="admin-preview-image" src={draft.image} alt={draft.name || "Preview"} />
                  </div>
                )}
                <button className="btn btn-primary">Lưu sản phẩm</button>
              </form>
            </div>
            <div className="glass-panel">
              <h3>Danh sách sản phẩm</h3>
              <div className="admin-list">
                {adminPaginatedProducts.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div>
                      <div className="admin-list-image-wrap">
                        <img className="admin-list-image" src={item.image} alt={item.name} />
                      </div>
                      <strong>{item.name}</strong>
                      <div className="small text-secondary">{item.category} | {currency(item.price)}</div>
                    </div>
                    <button className="btn btn-outline-light btn-sm" onClick={() => setDraft({ ...item, specs: item.specs.join(", ") })}>Sửa nhanh</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => onDeleteProduct(item.id)}>Xóa</button>
                  </div>
                ))}
              </div>
              <div className="pagination-shell">
                <button
                  className="btn btn-outline-light btn-sm"
                  disabled={adminProductPage === 1}
                  onClick={() => setAdminProductPage((page) => Math.max(1, page - 1))}
                >
                  Trước
                </button>
                {Array.from({ length: adminTotalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    className={`btn btn-sm ${page === adminProductPage ? "btn-primary" : "btn-outline-light"}`}
                    onClick={() => setAdminProductPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="btn btn-outline-light btn-sm"
                  disabled={adminProductPage === adminTotalPages}
                  onClick={() => setAdminProductPage((page) => Math.min(adminTotalPages, page + 1))}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div className="auth-layout">
            <div className="glass-panel">
              <h3>Thêm danh mục</h3>
              <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onCreateCategory(newCategory); setNewCategory(""); }}>
                <input className="form-control" placeholder="Tên danh mục mới" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
                <button className="btn btn-primary">Thêm danh mục</button>
              </form>
            </div>
            <div className="glass-panel">
              <h3>Chỉnh sửa danh mục</h3>
              <div className="admin-list">
                {categories.map((category) => (
                  <div className="cart-row" key={category}>
                    <input className="form-control" value={rename[category] ?? category} onChange={(event) => setRename({ ...rename, [category]: event.target.value })} />
                    <button className="btn btn-outline-light btn-sm" onClick={() => onRenameCategory(category, rename[category] ?? category)}>Đổi tên</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => onDeleteCategory(category)}>Xóa</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="admin-list">
            {adminOrders.map((order) => (
              <div className="feature-card" key={order.id}>
                <strong>{order.id}</strong>
                <p>{order.username} | {currency(order.total)} | {order.status}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <div className="admin-list">
            {adminUsers.map((user) => (
              <div className="cart-row" key={user.id}>
                <div>
                  <strong>{user.username}</strong>
                  <div className="small text-secondary">{user.email} | {user.phone}</div>
                </div>
                <div className="small">{user.role}</div>
                {user.role === "user" && (
                  <button className={`btn btn-sm ${user.isLocked ? "btn-outline-success" : "btn-outline-danger"}`} onClick={() => onToggleLock(user.id)}>
                    {user.isLocked ? "Mở khóa" : "Khóa"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
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
            <p>Store chuyên máy tính và linh kiện điện tử cho học tập, gaming, đồ họa và công việc IT.</p>
          </div>
          <div className="col-md-4">
            <h5>Liên hệ</h5>
            <p>Địa chỉ: 161 Nguyễn Gia Trí, Bình Thạnh</p>
            <p>Điện thoại: 0909954360</p>
          </div>
          <div className="col-md-4">
            <h5>Chủ store</h5>
            <p>Trần Đông Khuê</p>
            <p>Copyright © 2026 Zanee.Store</p>
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
  const [adminData, setAdminData] = useState({ stats: {}, users: [], orders: [], categories: [] });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastBuild, setLastBuild] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } catch (error) {
        localStorage.removeItem("zanee-token");
        setSession({ token: "", user: null, favorites: [], cart: [], orders: [] });
      }
    })();
  }, [session.token]);

  useEffect(() => {
    if (session.user?.role !== "admin" || !session.token) return;
    (async () => {
      try {
        const [stats, users, orders, categories] = await Promise.all([
          api("/admin/stats", { token: session.token }),
          api("/admin/users", { token: session.token }),
          api("/admin/orders", { token: session.token }),
          api("/admin/categories", { token: session.token }),
        ]);
        setAdminData({ stats, users, orders, categories });
      } catch (error) {
        setToast(error.message);
      }
    })();
  }, [session.user?.role, session.token]);

  useEffect(() => {
    if (session.user?.isLocked && route.name !== "blocked") {
      goTo("/blocked");
    }
  }, [session.user?.isLocked, route.name]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshMe = useCallback(async (token = session.token) => {
    if (!token) return;
    try {
      const data = await api("/me", { token });
      setSession((current) => ({ ...current, token, ...data }));
      localStorage.setItem("zanee-token", token);
    } catch (error) {
      localStorage.removeItem("zanee-token");
      setSession({ token: "", user: null, favorites: [], cart: [], orders: [] });
    }
  }, [session.token]);

  const refreshAdmin = useCallback(async () => {
    if (!session.token) return;
    try {
      const [stats, users, orders, categories] = await Promise.all([
        api("/admin/stats", { token: session.token }),
        api("/admin/users", { token: session.token }),
        api("/admin/orders", { token: session.token }),
        api("/admin/categories", { token: session.token }),
      ]);
      setAdminData({ stats, users, orders, categories });
    } catch (error) {
      setToast(error.message);
    }
  }, [session.token]);

  function requireLogin(featureName) {
    setToast(`Bạn cần đăng nhập để sử dụng chức năng ${featureName}.`);
    setAuthMode("login");
    goTo("/auth");
  }

  function handleLogout() {
    localStorage.removeItem("zanee-token");
    setSession({ token: "", user: null, favorites: [], cart: [], orders: [] });
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
      setToast(type === "login" ? "Đăng nhập thành công." : "Đăng ký thành công.");
      setSession((current) => ({ ...current, token: data.token, user: data.user }));
      await refreshMe(data.token);
      if (data.user.isLocked) {
        goTo("/blocked");
      } else if (data.user.role === "admin") {
        goTo("/admin");
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
    if (!session.user) return requireLogin("lưu yêu thích");
    if (session.user.role !== "user") return setToast("Admin không dùng danh sách yêu thích.");
    try {
      await api(`/favorites/${productId}`, { method: "POST", token: session.token });
      await refreshMe();
      setToast("Đã cập nhật danh sách yêu thích.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleAddToCart(productId, buyNow = false) {
    if (!session.user) return requireLogin("thêm giỏ hàng");
    if (session.user.role !== "user") return setToast("Admin không thể đặt hàng.");
    try {
      await api("/cart", { method: "POST", token: session.token, body: { productId, quantity: 1 } });
      await refreshMe();
      setToast(buyNow ? "Sản phẩm đã được thêm và chuyển tới giỏ hàng." : "Đã thêm vào giỏ hàng.");
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
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleBuild(payload) {
    if (!session.user) return requireLogin("build PC");
    try {
      const data = await api("/pc-builder", { method: "POST", token: session.token, body: payload });
      setLastBuild(data);
      await refreshMe();
      setToast("Đã dựng cấu hình và thêm linh kiện vào giỏ hàng.");
      goTo("/cart");
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
      goTo("/orders");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleChangePassword(payload) {
    try {
      const data = await api("/account/password", { method: "PATCH", token: session.token, body: payload });
      setToast(data.message);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleToggleLock(userId) {
    try {
      await api(`/admin/users/${userId}/toggle-lock`, { method: "PATCH", token: session.token });
      await refreshAdmin();
      setToast("Đã cập nhật trạng thái tài khoản.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleSaveProduct(product) {
    try {
      const editing = product.id && boot.products.some((item) => item.id === product.id);
      const endpoint = editing ? `/admin/products/${product.id}` : "/admin/products";
      const method = editing ? "PUT" : "POST";
      await api(endpoint, { method, token: session.token, body: product });
      const data = await api("/bootstrap");
      setBoot(data);
      await refreshAdmin();
      setToast("Đã lưu sản phẩm.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleDeleteProduct(productId) {
    try {
      await api(`/admin/products/${productId}`, { method: "DELETE", token: session.token });
      const data = await api("/bootstrap");
      setBoot(data);
      await refreshAdmin();
      setToast("Đã xóa sản phẩm.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleCreateCategory(name) {
    try {
      await api("/admin/categories", { method: "POST", token: session.token, body: { name } });
      const data = await api("/bootstrap");
      setBoot(data);
      await refreshAdmin();
      setToast("Đã thêm danh mục.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleRenameCategory(oldName, name) {
    try {
      await api(`/admin/categories/${encodeURIComponent(oldName)}`, { method: "PUT", token: session.token, body: { name } });
      const data = await api("/bootstrap");
      setBoot(data);
      await refreshAdmin();
      setToast("Đã đổi tên danh mục.");
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleDeleteCategory(name) {
    try {
      await api(`/admin/categories/${encodeURIComponent(name)}`, { method: "DELETE", token: session.token });
      const data = await api("/bootstrap");
      setBoot(data);
      await refreshAdmin();
      setToast("Đã xóa danh mục.");
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

  const routeDenied =
    (ADMIN_ROUTES.includes(route.name) && session.user?.role !== "admin") ||
    (USER_ONLY_ROUTES.includes(route.name) && session.user && session.user.role !== "user");

  let content = null;

  if (loading) {
    content = <ScreenCard title="Đang tải dữ liệu store" text="Hệ thống đang nạp danh sách sản phẩm và cấu hình demo." />;
  } else if (route.name === "blocked") {
    content = (
      <ScreenCard
        title="Tài khoản đã bị khóa"
        text="Vui lòng liên hệ admin để được hỗ trợ mở khóa qua số 0909954360."
      />
    );
  } else if (routeDenied) {
    content = <ScreenCard title="403" text="Bạn không có quyền truy cập trang này hoặc đang cố vượt phân quyền qua URL." />;
  } else if (session.user?.isLocked && route.name !== "blocked") {
    content = null;
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
          />
        );
        break;
      case "builder":
        content = session.user ? <BuilderPage onBuild={handleBuild} lastBuild={lastBuild} /> : <ScreenCard title="Cần đăng nhập" text="Hãy đăng nhập để hệ thống tự dựng PC và thêm vào giỏ hàng." />;
        break;
      case "guide":
        content = route.id ? <GuideDetailPage post={GUIDE_POSTS.find((item) => item.id === route.id)} /> : <GuidePage posts={GUIDE_POSTS} />;
        break;
      case "cart":
        content = session.user ? <CartPage cart={session.cart} onQuantity={handleQuantity} onRemove={handleRemove} onCheckout={handleCheckout} /> : <ScreenCard title="Cần đăng nhập" text="Bạn cần đăng nhập để xem giỏ hàng." />;
        break;
      case "favorites":
        content = session.user ? <FavoritesPage favorites={session.favorites} onDetail={(id) => goTo(`/product/${id}`)} /> : <ScreenCard title="Cần đăng nhập" text="Đăng nhập để xem danh sách yêu thích." />;
        break;
      case "orders":
        content = session.user ? <OrdersPage orders={session.orders} /> : <ScreenCard title="Cần đăng nhập" text="Đăng nhập để xem hóa đơn." />;
        break;
      case "account":
        content = session.user ? <AccountPage user={session.user} onChangePassword={handleChangePassword} /> : <ScreenCard title="Cần đăng nhập" text="Đăng nhập để xem thông tin tài khoản." />;
        break;
      case "admin":
        content = (
          <AdminPage
            adminStats={adminData.stats}
            adminUsers={adminData.users}
            adminOrders={adminData.orders}
            categories={adminData.categories.length ? adminData.categories : boot.categories}
            products={boot.products}
            onToggleLock={handleToggleLock}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onCreateCategory={handleCreateCategory}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
          />
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
