import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { perfumes } from '../data/perfumes';
import PerfumeCard from '../components/PerfumeCard';
import './Home.css';

const bestsellers = perfumes.filter(p => p.bestseller);

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return pos;
}

function HeroSection() {
  const ref = useRef(null);
  const mousePos = useMousePosition();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero-bg" style={{ y }}>
        <div className="hero-gradient-bg" />
      </motion.div>

      <div className="hero-accent-line" />

      <motion.div className="hero-content" style={{ opacity }}>
        <div className="hero-content-inner">
          <motion.span
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="eyebrow-line" />
            Established 1924 &middot; Paris
            <span className="eyebrow-line" />
          </motion.span>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            The Essence<br /><span className="accent-gold">of Quiet Luxury</span>
          </motion.h1>

          <div className="hero-divider">
            <span className="hero-divider-diamond" />
          </div>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Rare botanicals, elegant woods, and luminous musks composed for
            a signature that lingers with intention.
          </motion.p>

          <motion.div
            className="hero-trust"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1 }}
          >
            <span>Original Products</span>
            <span>Fast Delivery</span>
            <span>Secure Payment</span>
          </motion.div>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <Link to="/products" className="btn-primary hero-btn">
              <span>Explore Collection</span>
              <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link to="/product/1" className="btn-secondary hero-btn">
              <span>Our Story</span>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="hero-showcase"
          initial={{ opacity: 0, x: 56 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <div className="hero-product-card">
            <div className="hero-product-image">
              <img src="/images/perfumes/lumiere-doree.jpg" alt="" />
            </div>
            <div className="hero-product-meta">
              <span>Parfum</span>
              <strong>Lumière Dorée</strong>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-mouse-glow"
        animate={{
          x: mousePos.x - 200,
          y: mousePos.y - 200,
        }}
        transition={{ type: 'spring', damping: 50, stiffness: 200 }}
      />
    </section>
  );
}

function BrandStory() {
  return (
    <section className="brand-story">
      <div className="container">
        <div className="story-grid">
          <motion.div
            className="story-image"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="/images/brand/brand-heritage.jpg"
              alt="Perfume crafting"
            />
          </motion.div>

          <motion.div
            className="story-content"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-eyebrow">Our Heritage</span>
            <h2 className="section-title">A Legacy of<br />Uncompromising Craft</h2>
            <div className="story-divider" />
            <p>
              Since 1924, Maison Dorée has been the guardian of an extraordinary tradition.
              Each fragrance begins its journey in the rose gardens of Grasse and the oud
              forests of Southeast Asia.
            </p>
            <p>
              Our master perfumers dedicate months, sometimes years, to perfecting a single
              composition. They source the rarest ingredients — hand-pressed bergamot from
              Calabria, wild-harvested iris from Florence, and centuries-old oud from
              Cambodia.
            </p>
            <p>
              The result is not merely a perfume, but a piece of wearable art that
              tells a story of heritage, passion, and the relentless pursuit of perfection.
            </p>
            <Link to="/products" className="btn-primary">
              Discover Our Craft
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  return (
    <section className="featured-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">The Collection</span>
          <h2 className="section-title">Featured Fragrances</h2>
        </motion.div>

        <div className="perfume-grid">
          {perfumes.slice(0, 4).map((perfume, index) => (
            <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
          ))}
        </div>

        <motion.div
          className="section-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link to="/products" className="btn-primary">
            View All Fragrances
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function BestsellersSection() {
  return (
    <section className="bestsellers-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">Most Loved</span>
          <h2 className="section-title">Best Sellers</h2>
        </motion.div>

        <div className="bestsellers-grid">
          {bestsellers.map((perfume, index) => (
            <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="newsletter-section">
      <div className="container">
        <motion.div
          className="newsletter-card"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-eyebrow">Stay Connected</span>
          <h2 className="newsletter-title">Join Our Inner Circle</h2>
          <p className="newsletter-desc">
            Receive exclusive previews of new collections, invitations to private events,
            and personalized fragrance recommendations.
          </p>
          <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit">Subscribe</button>
          </form>
          <p className="newsletter-privacy">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <BrandStory />
      <BestsellersSection />
      <NewsletterSection />
    </>
  );
}
