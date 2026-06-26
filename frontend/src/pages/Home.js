import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { perfumes } from '../data/perfumes';
import PerfumeCard from '../components/PerfumeCard';
import './Home.css';

const bestsellers = perfumes.filter(p => p.bestseller);

function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero-bg" style={{ y }}>
        <div className="hero-gradient-bg" />
        <div className="hero-orbs">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
      </motion.div>

      <motion.div className="hero-content" style={{ opacity }}>
        <motion.span
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Established 1924 &middot; Paris
        </motion.span>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          The Essence<br /><span className="accent-gold">of Elegance</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Where artistry meets the finest ingredients to create<br />
          fragrances that transcend time.
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <Link to="/products" className="btn-primary">
            Explore Collection
          </Link>
          <Link to="/product/1" className="btn-secondary">
            Our Story
          </Link>
        </motion.div>
      </motion.div>

      <div className="hero-scroll-indicator">
        <motion.div
          className="scroll-line"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
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
