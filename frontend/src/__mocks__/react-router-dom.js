// Manual mock for react-router-dom v7 (ESM-only module, CJS not available for jest.requireActual)
const React = require('react');

const mockNavigate = jest.fn();

const mockModule = {
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Link: ({ children, to, className, style, ...props }) =>
    React.createElement('a', { href: to, className, style, ...props }, children),
  NavLink: ({ children, to, className, ...props }) =>
    React.createElement('a', { href: to, className, ...props }, children),
  MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  Routes: ({ children }) => React.createElement(React.Fragment, null, children),
  Route: () => null,
  Navigate: () => null,
  Outlet: () => null,
  useHref: () => '',
  useMatch: () => null,
  useResolvedPath: () => ({ pathname: '' }),
};

module.exports = mockModule;
