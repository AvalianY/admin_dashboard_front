import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "./auth-context";
import { Icon } from "../components/Icon";
import { Notice } from "../components/ui";
import type { IconName } from "../components/icon-data";
import styles from "./layout.module.css";

const routes: { path: string; title: string; icon: IconName; active: IconName }[] = [
  { path: "dashboard", title: "Dashboard", icon: "dashboard-default", active: "dashboard" },
  { path: "orders", title: "Orders", icon: "cart", active: "cart-active" },
  { path: "products", title: "Products", icon: "flask", active: "flask-active" },
  { path: "suppliers", title: "Suppliers", icon: "pharmacy", active: "pharmacy-active" },
  { path: "customers", title: "Customers", icon: "users", active: "users-active" },
];
function MobileMenu({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const signOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", {
        replace: true,
        state: {
          notice:
            "Local session cleared. Server logout could not be confirmed; the session will expire at its original expiry time.",
        },
      });
    }
  };
  return (
    <dialog
      ref={dialog}
      aria-label="Main menu"
      className={styles.menu}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onDismiss();
      }}
    >
      <button
        type="button"
        aria-label="Close menu"
        className={styles.menuClose}
        disabled={pending}
        onClick={onDismiss}
      >
        <Icon name="close" />
      </button>
      <nav aria-label="Main navigation">
        <ul>
          {routes.map((route) => (
            <li key={route.path}>
              <NavLink to={`/${route.path}`} aria-label={route.title} onClick={onDismiss}>
                {({ isActive }) => (
                  <span className={`${styles.navCircle} ${isActive ? styles.selected : ""}`}>
                    <Icon name={isActive ? route.active : route.icon} size={(16 * 38) / 44} />
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className={styles.logout}
        aria-label="Log out"
        aria-busy={pending}
        disabled={pending}
        onClick={() => void signOut()}
      >
        <span className={styles.logoutDefault}>
          <Icon name="logout" size={(58 * 38) / 44} />
        </span>
        <span className={styles.logoutHover}>
          <Icon name="logout-hover" size={(58 * 38) / 44} />
        </span>
      </button>
    </dialog>
  );
}
export function Layout() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const page = pathname.split("/")[1];
  const breadcrumb = page === "dashboard" ? "Dasboard" : `All ${page}`;
  return (
    <>
      <a href="#main" className="skipLink">
        Skip to content
      </a>
      <header className={styles.header}>
        <button
          className={styles.burger}
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
        >
          <Icon name="menu-burger" />
        </button>
        <img
          src="/images/header-logo@2x.png"
          width={32}
          height={32}
          alt="E-Pharmacy"
          className={styles.logo}
        />
        <div className={styles.heading}>
          <h1>Medicine store</h1>
          <p>
            <span>{breadcrumb}</span>
            <span className={styles.email} title={user?.email}>
              {user?.email}
            </span>
          </p>
        </div>
      </header>
      <Outlet />
      {menu && <MobileMenu onDismiss={() => setMenu(false)} />}
    </>
  );
}
export function SessionStatus({ error, retry }: { error: string | null; retry: () => void }) {
  return (
    <main className={styles.session}>
      {error ? (
        <Notice error retry={retry}>
          {error}
        </Notice>
      ) : (
        <Notice>Restoring your session… The free server may take a little time to wake up.</Notice>
      )}
    </main>
  );
}
