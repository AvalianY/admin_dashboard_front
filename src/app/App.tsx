import { Navigate, Outlet, Route, Routes } from "react-router";
import { useAuth } from "./auth-context";
import { Layout, SessionStatus } from "./Layout";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Records } from "../pages/Records";
import styles from "./mobile-shell.module.css";

function Protected() {
  const auth = useAuth();
  if (auth.checking) return <SessionStatus error={auth.error} retry={auth.retry} />;
  return auth.session ? <Outlet /> : <Navigate to="/login" replace />;
}
function Entry() {
  const auth = useAuth();
  if (auth.checking) return <SessionStatus error={auth.error} retry={auth.retry} />;
  return <Navigate to={auth.session ? "/dashboard" : "/login"} replace />;
}
function PublicLogin() {
  const auth = useAuth();
  if (auth.checking) return <SessionStatus error={auth.error} retry={auth.retry} />;
  return auth.session ? <Navigate to="/dashboard" replace /> : <Login />;
}
export function App() {
  return (
    <div className={styles.mobileShell}>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/login" element={<PublicLogin />} />
        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Records key="orders" kind="orders" />} />
            <Route path="/products" element={<Records key="products" kind="products" />} />
            <Route path="/suppliers" element={<Records key="suppliers" kind="suppliers" />} />
            <Route path="/customers" element={<Records key="customers" kind="customers" />} />
          </Route>
        </Route>
        <Route path="/home" element={<Entry />} />
        <Route path="/dasboard" element={<Entry />} />
        <Route path="*" element={<Entry />} />
      </Routes>
    </div>
  );
}
