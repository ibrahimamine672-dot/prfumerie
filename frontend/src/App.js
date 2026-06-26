import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Checkout from './pages/Checkout';
import AdminOrders from './pages/AdminOrders';
import './styles/global.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <LoadingScreen />
        <div className="page-wrapper">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
