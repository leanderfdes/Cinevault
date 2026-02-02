import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home.jsx";
import Movies from "./pages/Movies.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";

const page = {
  initial: { opacity: 0, y: 14, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(10px)" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

function Page({ children }) {
  return (
    <motion.div
      initial={page.initial}
      animate={page.animate}
      exit={page.exit}
      transition={page.transition}
      className="min-h-[calc(100vh-80px)]"
    >
      {children}
    </motion.div>
  );
}

// ✅ Protect routes (Home / Movies)
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
        <div className="text-muted">
          © {new Date().getFullYear()} CineVault • Built by{" "}
          <a
            className="text-text hover:underline"
            href="https://github.com/leanderfdes"
            target="_blank"
            rel="noreferrer"
          >
            Leander Fernandes
          </a>
        </div>

        <div className="flex gap-4">
          <a
            className="text-muted hover:text-text transition"
            href="https://github.com/leanderfdes"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="text-muted hover:text-text transition"
            href="https://github.com/leanderfdes"
            target="_blank"
            rel="noreferrer"
          >
            Learn More
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* ✅ Login / Register public */}
              <Route path="/login" element={<Page><Login /></Page>} />
              <Route path="/register" element={<Page><Register /></Page>} />

              {/* ✅ Home kept as "/" but protected */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Page><Home /></Page>
                  </ProtectedRoute>
                }
              />

              {/* ✅ Movies protected */}
              <Route
                path="/movies"
                element={
                  <ProtectedRoute>
                    <Page><Movies /></Page>
                  </ProtectedRoute>
                }
              />

              {/* ✅ unknown routes */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        <Footer />
      </div>
    </AuthProvider>
  );
}
