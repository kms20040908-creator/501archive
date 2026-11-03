import "./Navbar.css";
function Navbar() {
  return (
    <nav className="navbar">
  
      <h2
        style={{
          margin: 0,
          fontSize: "24px",
          cursor: "pointer",
        }}
      >
        5o1.archive
      </h2>

      <div
        style={{
          display: "flex",
          gap: "30px",
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        <span>SHOP</span>
        <span>ABOUT</span>
        <span>CONTACT</span>
      </div>
    </nav>
  );
}

export default Navbar;