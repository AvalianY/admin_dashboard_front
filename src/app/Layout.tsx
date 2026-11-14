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
function Navigation({
  onNavigate,
  iconSize = (16 * 38) / 44,
}: {
  onNavigate?: () => void;
  iconSize?: number;
}) {
  return (
    <nav aria-label="Main navigation" className={styles.navigation}>
      <ul>
        {routes.map((route) => (
          <li key={route.path}>
            <NavLink to={`/${route.path}`} aria-label={route.title} onClick={onNavigate}>
              {({ isActive }) => (
                <span className={`${styles.navCircle} ${isActive ? styles.selected : ""}`}>
                  <Icon name={isActive ? route.active : route.icon} size={iconSize} />
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
function LogoutButton({
  pending,
  onLogout,
  desktop = false,
}: {
  pending: boolean;
  onLogout: () => void;
  desktop?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.logout} ${desktop ? styles.headerLogout : ""}`}
      aria-label="Log out"
      aria-busy={pending}
      disabled={pending}
      onClick={onLogout}
    >
      <span className={styles.logoutDefault}>
        <Icon name="logout" size={desktop ? 58 : (58 * 38) / 44} />
      </span>
      <span className={styles.logoutHover}>
        <Icon name="logout-hover" size={desktop ? 58 : (58 * 38) / 44} />
      </span>
    </button>
  );
}
function MobileMenu({
  onDismiss,
  pending,
  onLogout,
}: {
  onDismiss: () => void;
  pending: boolean;
  onLogout: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
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
      <Navigation onNavigate={onDismiss} />
      <LogoutButton pending={pending} onLogout={onLogout} />
    </dialog>
  );
}
export function Layout() {
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1440px)");
    const closeMenu = () => {
      if (media.matches) setMenu(false);
    };
    media.addEventListener("change", closeMenu);
    return () => media.removeEventListener("change", closeMenu);
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
        <picture>
          <source media="(min-width: 768px)" srcSet="/images/header-logo-tablet@2x.png" />
          <img
            src="/images/header-logo@2x.png"
            width={32}
            height={32}
            alt="E-Pharmacy"
            className={styles.logo}
          />
        </picture>
        <div className={styles.heading}>
          <h1>Medicine store</h1>
          <p>
            <span>{breadcrumb}</span>
            <span className={styles.email} title={user?.email}>
              {user?.email}
            </span>
          </p>
        </div>
        <LogoutButton pending={pending} onLogout={() => void signOut()} desktop />
      </header>
      <aside className={styles.sidebar} aria-label="Sidebar">
        <Navigation iconSize={16} />
      </aside>
      <Outlet />
      {menu && (
        <MobileMenu
          onDismiss={() => setMenu(false)}
          pending={pending}
          onLogout={() => void signOut()}
        />
      )}
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
