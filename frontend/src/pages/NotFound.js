import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '6rem',
          fontWeight: 400,
          color: 'var(--color-gold)',
          lineHeight: 1,
          marginBottom: '16px'
        }}>
          404
        </h1>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          marginBottom: '12px'
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          marginBottom: '32px',
          maxWidth: 400
        }}>
          This fragrance doesn't seem to exist. Let's get you back to the collection.
        </p>
        <Link to="/" className="btn-primary">
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
