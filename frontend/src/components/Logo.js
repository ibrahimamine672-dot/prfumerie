import { Link } from 'react-router-dom';

export default function Logo({ size = 28, link = true }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="80" fill="currentColor" />
      <path d="M256 120c-45 0-70 20-70 55v-15c0-35 25-55 70-55s70 20 70 55v15c0-35-25-55-70-55z" fill="var(--color-bg)" opacity="0.3" />
      <path d="M210 160h92l-12 190c-2 28-26 50-34 50s-32-22-34-50l-12-190z" fill="var(--color-bg)" />
      <path d="M230 160h52l-8 130c-2 28-14 50-18 50s-16-22-18-50l-8-130z" fill="var(--color-accent)" opacity="0.4" />
    </svg>
  );

  if (link) {
    return <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>{svg}</Link>;
  }

  return svg;
}
