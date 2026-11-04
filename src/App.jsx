import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  getProducts,
  saveProduct as saveCloudProduct,
  deleteProduct as deleteCloudProduct,
  uploadProductImage,
  getHeroImage,
  saveHeroImage,
} from "./supabaseData";
import "./App.css";

const starterProducts = [
  { id: "p1", name: "Avant-Garde Textured Panel Jacket", description: "", price: "₩10,000", images: ["/images/product-1.jpg"], category: "TOP", createdAt: 4 },
  { id: "p2", name: "System Cropped Brown Leather Jacket", description: "", price: "₩70,000", images: ["/images/product-2.jpg"], category: "TOP", createdAt: 3 },
  { id: "p3", name: "Mesh Knit Top", description: "", price: "₩20,000", images: ["/images/product-3.jpg"], category: "TOP", createdAt: 2 },
  { id: "p4", name: "Vintage Fur Collar Jacket", description: "", price: "₩60,000", images: ["/images/product-4.jpg"], category: "TOP", createdAt: 1 },
];

const PRODUCT_KEY = "501archive_products_v2";
const LEGACY_PRODUCT_KEY = "501archive_products_v1";
const HERO_KEY = "501archive_hero_v1";
const INSTAGRAM_URL = "https://www.instagram.com/5o1.archive/";
const CATEGORIES = ["TOP", "BOTTOM", "SHOES", "ACCESSORIES"];

function normalizeProduct(item, index = 0) {
  const images = Array.isArray(item.images) && item.images.length
    ? item.images
    : item.image ? [item.image] : [];

  const category =
    item.category === "OUTER" ? "TOP" :
    item.category === "ACCESSORY" ? "ACCESSORIES" :
    CATEGORIES.includes(item.category) ? item.category : "TOP";

  return {
    ...item,
    images,
    image: images[0] || "",
    category,
    status: item.status === "SOLD" ? "SOLD" : "AVAILABLE",
    createdAt: item.createdAt || index + 1,
    description: item.description || "",
  };
}

function readProducts() {
  try {
    const current = localStorage.getItem(PRODUCT_KEY);
    const legacy = localStorage.getItem(LEGACY_PRODUCT_KEY);
    const value = current || legacy;

    return (value ? JSON.parse(value) : starterProducts).map(normalizeProduct);
  } catch {
    return starterProducts.map(normalizeProduct);
  }
}

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// 기존 브라우저에 저장된 사진을 클라우드로 이전할 때 사용
async function migrateImage(image) {
  if (!image || !image.startsWith("data:")) return image;

  const blob = await fetch(image).then(response => response.blob());
  const file = new File([blob], `migrated-${Date.now()}.jpg`, {
    type: blob.type || "image/jpeg",
  });

  return uploadProductImage(file);
}

async function migrateProduct(product) {
  const images = await Promise.all(
    (product.images || []).map(migrateImage)
  );

  return {
    ...product,
    images,
    image: images[0] || "",
  };
}

function App() {
  const [products, setProducts] = useState(readProducts);
  const [heroImage, setHeroImage] = useState(() => read(HERO_KEY, "/images/hero.jpg"));
  const [selected, setSelected] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("MAIN");

  const newestProducts = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [products]
  );

  const sourceProducts =
    activeCategory === "MAIN" ? newestProducts :
    activeCategory === "ALL_ITEMS" ? products :
    products.filter(p => p.category === activeCategory);

  const visibleProducts = [...sourceProducts].sort(
    (a, b) => (a.status === "SOLD") - (b.status === "SOLD") || b.createdAt - a.createdAt
  );

  // 최초 접속 시 기존 브라우저 데이터를 클라우드로 이전
  useEffect(() => {
    async function loadCloudData() {
      try {
        const cloudProducts = await getProducts();
        const cloudHero = await getHeroImage();

        if (cloudProducts.length === 0) {
          const localProducts = readProducts();
          const migratedProducts = await Promise.all(
            localProducts.map(migrateProduct)
          );

          for (const product of migratedProducts) {
            await saveCloudProduct(product);
          }

          const localHero = read(HERO_KEY, "/images/hero.jpg");
          const migratedHero = await migrateImage(localHero);

          if (migratedHero !== "/images/hero.jpg") {
            await saveHeroImage(migratedHero);
          }

          setProducts(migratedProducts);
          setHeroImage(migratedHero);
        } else {
          setProducts(cloudProducts);
          setHeroImage(cloudHero);
        }
      } catch (error) {
        console.error("Cloud loading error:", error);
      }
    }

    loadCloudData();
  }, []);

  if (window.location.pathname.replace(/\/+$/, "") === "/admin") {
    return (
      <Admin
        products={products}
        setProducts={setProducts}
        heroImage={heroImage}
        setHeroImage={setHeroImage}
      />
    );
  }

  const openProduct = product => {
    setSelected(product);
    setPhotoIndex(0);
  };

  const chooseCategory = category => {
    setActiveCategory(category);
    setMobileMenu(false);

    if (category === "MAIN") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      requestAnimationFrame(() =>
        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })
      );
    }
  };

  return (
    <div className="site-shell">
      <header className="navbar">
        <div className="nav-left">
          <button
            className="hamburger-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open category menu"
            aria-expanded={mobileMenu}
          >
            <span></span><span></span><span></span>
          </button>
          <button className="logo logo-button" onClick={() => chooseCategory("MAIN")}>
            501.archive
          </button>
        </div>
        <span className="nav-caption">VINTAGE & ARCHIVE</span>
      </header>

      {mobileMenu && (
        <div className="drawer-backdrop" onClick={() => setMobileMenu(false)}>
          <aside
            className="category-drawer"
            onClick={e => e.stopPropagation()}
            aria-label="Site navigation"
          >
            <div className="drawer-heading">
              <span className="eyebrow">501.ARCHIVE / MENU</span>
              <button
                className="drawer-close"
                onClick={() => setMobileMenu(false)}
                aria-label="Close menu"
              >×</button>
            </div>

            <nav className="drawer-links">
              <button className={activeCategory === "MAIN" ? "drawer-active" : ""} onClick={() => chooseCategory("MAIN")}>MAIN</button>
              <button className={activeCategory === "ALL_ITEMS" ? "drawer-active" : ""} onClick={() => chooseCategory("ALL_ITEMS")}>ALL ITEMS</button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  className={activeCategory === category ? "drawer-active" : ""}
                  onClick={() => chooseCategory(category)}
                >{category}</button>
              ))}
              <a href="#contact" onClick={() => setMobileMenu(false)}>CONTACT</a>
            </nav>
            <div className="drawer-foot">EST. 2024 — VINTAGE & ARCHIVE</div>
          </aside>
        </div>
      )}

      <main id="top">
        {activeCategory === "MAIN" && (
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">EST. 2024 — VINTAGE & ARCHIVE</span>
              <h1>CURATED<br />VINTAGE ARCHIVE</h1>
              <p>Timeless pieces, found stories.</p>
              <a className="text-link" href="#shop">
                DISCOVER THE COLLECTION <span>↗</span>
              </a>
              <span className="hero-index">001 / 501 ARCHIVE</span>
            </div>
            <div className="hero-image">
              <img src={heroImage} alt="501.archive editorial visual" />
            </div>
          </section>
        )}

        <section className="new-arrivals" id="shop">
          <div className="section-title">
            <div>
              <span className="eyebrow">THE LATEST FINDS</span>
              <h2>
                {activeCategory === "MAIN" ? "NEW ARRIVALS" :
                  activeCategory === "ALL_ITEMS" ? "ALL ITEMS" : activeCategory}
                <span className="count">({String(visibleProducts.length).padStart(2, "0")})</span>
              </h2>
            </div>
            <span className="view-label">SELECTED VINTAGE / 2026</span>
          </div>

          <div className="product-grid">
            {visibleProducts.map(product => (
              <button className="product-card" key={product.id} onClick={() => openProduct(product)}>
                <span className="product-image">
                  <img src={product.images[0] || product.image} alt={product.name} />
                  <span className="quick-view">VIEW ↗</span>
                </span>
                <span className="product-meta">
                  <span className="product-name">{product.name}</span>
                  <strong className={product.status === "SOLD" ? "sold-price" : ""}>
                    {product.status === "SOLD" ? "SOLD" : product.price}
                  </strong>
                </span>
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <p className="empty-products">NO ITEMS IN THIS CATEGORY YET.</p>
          )}
        </section>
      </main>

      <footer id="contact">
        <button className="logo logo-button" onClick={() => chooseCategory("MAIN")}>501.archive</button>
        <span>VINTAGE WITH A STORY.</span>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">CONTACT INSTAGRAM ↗</a>
        <small>© 2026 501.ARCHIVE. ALL RIGHTS RESERVED.</small>
      </footer>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="product-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close product details">×</button>
            <div className="modal-gallery">
              <img
                src={selected.images?.[photoIndex] || selected.image}
                alt={selected.name}
              />
              {(selected.images?.length || 0) > 1 && (
                <div className="gallery-controls">
                  <button onClick={() => setPhotoIndex(i => (i - 1 + selected.images.length) % selected.images.length)}>←</button>
                  <span>{photoIndex + 1} / {selected.images.length}</span>
                  <button onClick={() => setPhotoIndex(i => (i + 1) % selected.images.length)}>→</button>
                </div>
              )}
            </div>
            <div>
              <span className="eyebrow">501.ARCHIVE — SELECTED PIECE</span>
              <h3>{selected.name}</h3>
              <strong className={selected.status === "SOLD" ? "sold-price" : ""}>
                {selected.status === "SOLD" ? "SOLD" : selected.price}
              </strong>
              <p className="product-description">
                {selected.description || "For purchase inquiries, please contact us."}
              </p>
              <a className="text-link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
                CONTACT INSTAGRAM ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("사진 한 장은 15MB 이하로 선택해 주세요.");
  }

  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", 0.78)
  );

  if (!blob) throw new Error("사진을 변환하지 못했습니다.");

  return new File([blob], `image-${Date.now()}.jpg`, {
    type: "image/jpeg",
  });
}

function Admin({ products, setProducts, heroImage, setHeroImage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    price: "",
    category: "TOP",
    images: [],
    status: "AVAILABLE",
  });
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
const [isRecovery, setIsRecovery] = useState(false);
const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) setError(error.message);
      setLoggedIn(!!data.session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
  setLoggedIn(!!session);

  if (event === "PASSWORD_RECOVERY") {
  console.log("비밀번호 재설정 이벤트 감지!");
  setIsRecovery(true);
}
}
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const updatePassword = async e => {
  e.preventDefault();
  setError("");

  if (newPassword.length < 6) {
    setError("비밀번호는 6자 이상 입력해 주세요.");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    setError(error.message);
    return;
  }

  setIsRecovery(false);
  setNewPassword("");
  setLoggedIn(true);
  setNotice("비밀번호가 변경되었습니다.");
};
  const login = async e => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.");
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    setLoggedIn(false);
    setPassword("");
  };

  const startNew = () => {
    setEditing("new");
    setDraft({
      name: "",
      description: "",
      price: "",
      category: "TOP",
      images: [],
      status: "AVAILABLE",
    });
    setError("");
  };

  const startEdit = item => {
    setEditing(item.id);
    setDraft({
      ...item,
      images: item.images?.length ? [...item.images] : item.image ? [item.image] : [],
    });
    setError("");
  };

  const addImages = async files => {
    if (!files?.length) return;

    setUploading(true);
    setError("");

    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async file => {
          const compressed = await compressImage(file);
          return uploadProductImage(compressed);
        })
      );

      setDraft(d => ({ ...d, images: [...d.images, ...uploaded] }));
      setNotice(`${uploaded.length}장의 사진을 클라우드에 업로드했습니다.`);
    } catch (err) {
      setError(err.message || "사진을 업로드하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index, direction) => {
    setDraft(d => {
      const images = [...d.images];
      const target = index + direction;

      if (target < 0 || target >= images.length) return d;

      [images[index], images[target]] = [images[target], images[index]];
      return { ...d, images };
    });
  };

  const saveProduct = async e => {
    e.preventDefault();
    setError("");

    if (!draft.name.trim() || !draft.price.trim() || !draft.images.length) {
      setError("상품명, 가격, 사진을 모두 입력해 주세요.");
      return;
    }

    const existing = products.find(p => p.id === editing);

    const payload = {
      ...draft,
      id: editing === "new" ? `p-${crypto.randomUUID()}` : editing,
      image: draft.images[0],
      createdAt: editing === "new"
        ? Date.now()
        : (existing?.createdAt || Date.now()),
    };

    try {
      await saveCloudProduct(payload);

      setProducts(prev =>
        editing === "new"
          ? [...prev, payload]
          : prev.map(p => p.id === editing ? payload : p)
      );

      setEditing(null);
      setNotice("상품을 클라우드에 저장했습니다.");
    } catch (err) {
      setError(err.message || "상품 저장에 실패했습니다.");
    }
  };

  const removeProduct = async id => {
    if (!window.confirm("이 상품을 삭제할까요?")) return;

    try {
      await deleteCloudProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setNotice("상품을 삭제했습니다.");
    } catch (err) {
      setError(err.message || "상품 삭제에 실패했습니다.");
    }
  };

  const setStatus = async (id, status) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const updated = { ...product, status };

    try {
      await saveCloudProduct(updated);
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      setNotice(status === "SOLD"
        ? "상품을 SOLD로 변경했습니다."
        : "상품을 판매 중으로 변경했습니다.");
    } catch (err) {
      setError(err.message || "상태 변경에 실패했습니다.");
    }
  };

  const changeHero = async file => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const compressed = await compressImage(file);
      const url = await uploadProductImage(compressed);
      await saveHeroImage(url);

      setHeroImage(url);
      setNotice("메인 이미지를 클라우드에 저장했습니다.");
    } catch (err) {
      setError(err.message || "메인 이미지 변경에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return <div className="admin-login-wrap">LOADING...</div>;
  }

  if (isRecovery) {
  return (
    <div className="admin-login-wrap">
      <form className="login-card" onSubmit={updatePassword}>
        <a className="logo" href="/">501.archive</a>
        <span className="eyebrow">PASSWORD RECOVERY</span>
        <h1>NEW PASSWORD</h1>
        <p>새로운 관리자 비밀번호를 입력하세요.</p>

        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="NEW PASSWORD"
          autoComplete="new-password"
          required
        />

        {error && <p className="form-error">{error}</p>}

        <button className="admin-primary">UPDATE PASSWORD →</button>
      </form>
    </div>
  );
}
  if (!loggedIn) {
    return (
      <div className="admin-login-wrap">
        <form className="login-card" onSubmit={login}>
          <a className="logo" href="/">501.archive</a>
          <span className="eyebrow">PRIVATE ADMIN ACCESS</span>
          <h1>WELCOME BACK</h1>
          <p>관리자 계정으로 로그인하세요.</p>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="EMAIL"
            autoComplete="username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="PASSWORD"
            autoComplete="current-password"
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button className="admin-primary">LOG IN →</button>
          <a className="back-link" href="/">← BACK TO STORE</a>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a className="logo" href="/">501.archive</a>
        <span className="eyebrow">STORE MANAGEMENT</span>
        <button className="logout-button" onClick={logout}>LOG OUT</button>
      </header>

      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">CONTROL PANEL / 001</span>
            <h1>STORE ADMIN</h1>
            <p>상품과 메인 이미지를 관리합니다.</p>
          </div>
          <a href="/" className="back-link">VIEW STORE ↗</a>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}

        <section className="admin-section">
          <div className="admin-section-title">
            <div>
              <span className="eyebrow">01 / EDITORIAL</span>
              <h2>MAIN IMAGE</h2>
            </div>
          </div>

          <div className="hero-admin-row">
            <img src={heroImage} alt="Current main visual" />
            <label className="upload-label">
              CHANGE IMAGE
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={e => {
                  changeHero(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </section>

        <section className="admin-section">
          <div className="admin-section-title">
            <div>
              <span className="eyebrow">02 / INVENTORY</span>
              <h2>PRODUCTS <span className="count">({products.length})</span></h2>
            </div>
            <button className="admin-primary compact" onClick={startNew}>
              + ADD PRODUCT
            </button>
          </div>

          {editing && (
            <form className="product-editor" onSubmit={saveProduct}>
              <div className="editor-heading">
                <h3>{editing === "new" ? "NEW PRODUCT" : "EDIT PRODUCT"}</h3>
                <button
                  type="button"
                  className="logout-button"
                  onClick={() => setEditing(null)}
                >CANCEL ×</button>
              </div>

              <label>
                PRODUCT NAME
                <input
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Product name"
                />
              </label>

              <label>
                DESCRIPTION
                <textarea
                  rows="5"
                  value={draft.description || ""}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                  placeholder="상품 상세 설명, 사이즈, 컨디션 등을 입력하세요."
                />
              </label>

              <div className="editor-fields">
                <label>
                  PRICE
                  <input
                    value={draft.price}
                    onChange={e => setDraft({ ...draft, price: e.target.value })}
                    placeholder="₩70,000"
                  />
                </label>

                <label>
                  CATEGORY
                  <select
                    value={draft.category}
                    onChange={e => setDraft({ ...draft, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>

                <label>
                  STATUS
                  <select
                    value={draft.status}
                    onChange={e => setDraft({ ...draft, status: e.target.value })}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                </label>
              </div>

              <label>
                PRODUCT PHOTOS
                <span className="upload-hint">여러 장을 한 번에 선택할 수 있습니다.</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={e => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>

              {draft.images.length > 0 && (
                <div className="admin-photo-grid">
                  {draft.images.map((img, index) => (
                    <div className="admin-photo-item" key={`${index}-${img.slice(0, 24)}`}>
                      <img src={img} alt={`Product ${index + 1}`} />
                      <span>{index === 0 ? "MAIN PHOTO" : `PHOTO ${index + 1}`}</span>
                      <div className="photo-actions">
                        <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>←</button>
                        <button type="button" onClick={() => moveImage(index, 1)} disabled={index === draft.images.length - 1}>→</button>
                        <button
                          type="button"
                          onClick={() => setDraft(d => ({
                            ...d,
                            images: d.images.filter((_, i) => i !== index),
                          }))}
                        >REMOVE</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploading && <p className="notice">사진을 업로드하고 있습니다...</p>}
              {error && <p className="form-error">{error}</p>}

              <button className="admin-primary" disabled={uploading}>
                {uploading ? "UPLOADING..." : "SAVE PRODUCT →"}
              </button>
            </form>
          )}

          <div className="admin-product-list">
            {[...products]
              .sort((a, b) =>
                (a.status === "SOLD") - (b.status === "SOLD") ||
                b.createdAt - a.createdAt
              )
              .map(p => (
                <article className="admin-product" key={p.id}>
                  <img src={p.images?.[0] || p.image} alt={p.name} />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.status === "SOLD" ? "SOLD" : p.price} · {p.category}</span>
                  </div>
                  <select
                    aria-label={`${p.name} status`}
                    className="status-select"
                    value={p.status || "AVAILABLE"}
                    onChange={e => setStatus(p.id, e.target.value)}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="SOLD">SOLD</option>
                  </select>
                  <button onClick={() => startEdit(p)}>EDIT</button>
                  <button className="delete-button" onClick={() => removeProduct(p.id)}>DELETE</button>
                </article>
              ))}
          </div>
        </section>

        <p className="admin-footnote">
          상품과 사진은 Supabase 클라우드에 저장됩니다. 관리자 계정으로 로그인한 경우에만 상품을 수정할 수 있습니다.
        </p>
      </main>
    </div>
  );
}

export default App;