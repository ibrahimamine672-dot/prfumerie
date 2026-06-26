import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { perfumes, categories, genders, priceRanges } from '../data/perfumes';
import PerfumeCard from '../components/PerfumeCard';
import './Products.css';

export default function Products() {
  const [searchParams] = useSearchParams();
  const paramGender = searchParams.get('gender') || 'All';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState(paramGender);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSelectedGender(paramGender);
  }, [paramGender]);

  const filteredPerfumes = useMemo(() => {
    let result = perfumes.filter(p => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchGender = selectedGender === 'All' || p.gender === selectedGender;
      const priceRange = priceRanges[selectedPrice];
      const matchPrice = p.price >= priceRange.min && p.price < priceRange.max;
      return matchCategory && matchGender && matchPrice;
    });

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [selectedCategory, selectedGender, selectedPrice, sortBy]);

  return (
    <div className="products-page">
      <div className="products-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="section-eyebrow">The Collection</span>
          <h1 className="products-title">All Fragrances</h1>
          <p className="products-subtitle">
            Discover our curated collection of exquisite fragrances, each a masterpiece of olfactory art.
          </p>
        </motion.div>
      </div>

      <div className="container">
        <div className="products-layout">
          <button
            className="filter-toggle mobile-only"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>

          <AnimatePresence>
            <motion.aside
              className={`filters-sidebar ${filtersOpen ? 'mobile-open' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="filter-group">
                  <h3>Category</h3>
                  <div className="filter-options">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <h3>Gender</h3>
                  <div className="filter-options">
                    {genders.map(g => (
                      <button
                        key={g}
                        className={`filter-btn ${selectedGender === g ? 'active' : ''}`}
                        onClick={() => setSelectedGender(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <h3>Price</h3>
                  <div className="filter-options">
                    {priceRanges.map((range, i) => (
                      <button
                        key={range.label}
                        className={`filter-btn ${selectedPrice === i ? 'active' : ''}`}
                        onClick={() => setSelectedPrice(i)}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="filter-reset"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedGender('All');
                    setSelectedPrice(0);
                    setSortBy('default');
                  }}
                >
                  Reset All
                </button>
            </motion.aside>
          </AnimatePresence>

          <div className="products-main">
            <div className="products-toolbar">
              <p className="results-count">
                {filteredPerfumes.length} {filteredPerfumes.length === 1 ? 'fragrance' : 'fragrances'}
              </p>
              <select
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="default">Sort by: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            <div className="products-grid">
              <AnimatePresence mode="popLayout">
                {filteredPerfumes.map((perfume, index) => (
                  <PerfumeCard key={perfume.id} perfume={perfume} index={index} />
                ))}
              </AnimatePresence>
            </div>

            {filteredPerfumes.length === 0 && (
              <motion.div
                className="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>No fragrances match your current filters.</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedGender('All');
                    setSelectedPrice(0);
                  }}
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
