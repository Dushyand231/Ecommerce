export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h4>ShopSphere</h4>
          <p>Quality products, fair prices, fast delivery — trusted by thousands of shoppers.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="/shop">All Products</a></li>
            <li><a href="/shop?category=Electronics">Electronics</a></li>
            <li><a href="/shop?category=Fashion">Fashion</a></li>
            <li><a href="/shop?category=Home">Home</a></li>
          </ul>
        </div>
        <div>
          <h4>Customer Care</h4>
          <ul>
            <li>support@shopsphere.com</li>
            <li>+91 98765 43210</li>
            <li>Mon–Sat, 9am–7pm IST</li>
          </ul>
        </div>
        <div>
          <h4>Policies</h4>
          <ul>
            <li><a href="/">Privacy Policy</a></li>
            <li><a href="/">Terms of Service</a></li>
            <li><a href="/">Return Policy</a></li>
            <li><a href="/">Shipping Policy</a></li>
          </ul>
        </div>
        <div>
          <h4>Follow Us</h4>
          <div className="socials">
            <a href="#" aria-label="Facebook">FB</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="X">X</a>
            <a href="#" aria-label="LinkedIn">IN</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} ShopSphere. All rights reserved. Payments secured by Razorpay.</div>
    </footer>
  );
}