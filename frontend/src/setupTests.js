// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, whileInView, viewport, transition, layout, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    p: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
    h1: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <h1 {...rest}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <h2 {...rest}>{children}</h2>;
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    aside: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <aside {...rest}>{children}</aside>;
    },
    nav: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <nav {...rest}>{children}</nav>;
    },
    section: ({ children, ...props }) => {
      const { initial, animate, exit, ...rest } = props;
      return <section {...rest}>{children}</section>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
  useTransform: () => 0,
  useInView: () => true,
}));
