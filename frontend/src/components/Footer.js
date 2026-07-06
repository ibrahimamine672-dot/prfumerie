import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-wrap">
              <Logo size={32} />
              <div>
                <h3 className="footer-logo">MAISON DORÉE</h3>
                <p className="footer-tagline">PARIS</p>
              </div>
            </div>
            <p className="footer-desc">
              Crafting the finest fragrances since 1924. Each scent is a masterpiece, 
              composed with the rarest ingredients from around the world.
            </p>
          </div>

          <div className="footer-col">
            <h4>Collections</h4>
            <Link to="/products">All Fragrances</Link>
            <Link to="/products?gender=Men">For Him</Link>
            <Link to="/products?gender=Women">For Her</Link>
            <Link to="/products?gender=Unisex">Unisex</Link>
          </div>

          <div className="footer-col">
            <h4>Maison</h4>
            <button className="footer-link" onClick={() => {}} aria-label="Our Heritage">Our Heritage</button>
            <button className="footer-link" onClick={() => {}} aria-label="The Art of Perfumery">The Art of Perfumery</button>
            <button className="footer-link" onClick={() => {}} aria-label="Sustainability">Sustainability</button>
            <button className="footer-link" onClick={() => {}} aria-label="Careers">Careers</button>
          </div>

          <div className="footer-col">
            <h4>Client Services</h4>
            <button className="footer-link" onClick={() => {}} aria-label="Contact Us">Contact Us</button>
            <button className="footer-link" onClick={() => {}} aria-label="Shipping & Returns">Shipping & Returns</button>
            <button className="footer-link" onClick={() => {}} aria-label="Gift Cards">Gift Cards</button>
            <button className="footer-link" onClick={() => {}} aria-label="FAQ">FAQ</button>
          </div>
        </div>

        <div className="footer-social">
          <button className="footer-social-link" onClick={() => {}} aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <button className="footer-social-link" onClick={() => {}} aria-label="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </button>
          <button className="footer-social-link" onClick={() => {}} aria-label="Pinterest">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 4.13 2.52 7.68 6.12 9.18-.08-.72-.16-1.82.03-2.6l1.1-4.64s-.28-.56-.28-1.38c0-1.3.75-2.27 1.68-2.27.79 0 1.18.6 1.18 1.31 0 .8-.51 2-.78 3.11-.22.93.47 1.69 1.39 1.69 1.67 0 2.95-1.76 2.95-4.3 0-2.25-1.62-3.82-3.93-3.82-2.68 0-4.25 2.01-4.25 4.09 0 .81.31 1.68.7 2.15a.28.28 0 01.07.27l-.27 1.08c-.04.17-.14.2-.32.12-1.19-.56-1.93-2.3-1.93-3.7 0-3.01 2.19-5.78 6.31-5.78 3.31 0 5.89 2.36 5.89 5.52 0 3.29-2.07 5.94-4.95 5.94-.97 0-1.88-.5-2.19-1.1l-.6 2.27c-.22.83-.81 1.87-1.2 2.5.9.28 1.86.43 2.86.43 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </button>
          <button className="footer-social-link" onClick={() => {}} aria-label="YouTube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
            </svg>
          </button>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Maison Dorée. All rights reserved.</p>
          <div className="footer-legal">
            <button className="footer-legal-link" onClick={() => {}}>Privacy Policy</button>
            <button className="footer-legal-link" onClick={() => {}}>Terms of Service</button>
            <button className="footer-legal-link" onClick={() => {}}>Cookie Preferences</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
