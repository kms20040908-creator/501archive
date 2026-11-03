import "./Hero.css";

const products = [
  {
    name: "Tribal Print Top",
    price: "₩78,000",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900",
  },
  {
    name: "Vintage Leather Jacket",
    price: "₩168,000",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=900",
  },
  {
    name: "Mesh Knit Top",
    price: "₩64,000",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=900",
  },
  {
    name: "Lace Slip Dress",
    price: "₩94,000",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900",
  },
];

function Hero() {
  return (
    <main>
      <section className="hero">
        <div className="hero-text">
          <h1>
            CURATED
            <br />
            VINTAGE ARCHIVE
          </h1>

          <p>Timeless pieces, found stories.</p>

          <button>SHOP NOW <span>→</span></button>
        </div>

        <div className="hero-image"></div>
      </section>

      <section className="new-arrivals">
        <div className="section-header">
          <h3>NEW ARRIVALS</h3>
          <span>VIEW ALL →</span>
        </div>

        <div className="product-grid">
          {products.map((item) => (
            <div className="product-card" key={item.name}>
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
              <strong>{item.price}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Hero;