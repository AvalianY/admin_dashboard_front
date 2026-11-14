import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "./Icon";
import { filterSchema } from "../services/validation";
import { pageWindow } from "../utils/format";
import styles from "./ui.module.css";

export function Button({
  variant = "primary",
  pending,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
  pending?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || pending}
      aria-busy={pending || undefined}
      className={`${styles.button} ${styles[variant]} ${className}`}
    >
      {pending ? (
        <>
          <span aria-hidden="true">
            <Loader />
          </span>
          <span className="srOnly">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
export function Loader() {
  return (
    <span role="status" aria-label="Loading…" className={styles.loader}>
      <span className="srOnly">Loading…</span>
    </span>
  );
}
export function Notice({
  children,
  error = false,
  retry,
}: {
  children: ReactNode;
  error?: boolean;
  retry?: () => void;
}) {
  return (
    <div
      className={`${styles.notice} ${error ? styles.error : ""}`}
      role={error ? "alert" : "status"}
    >
      <p>{children}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function FilterBar({
  onFilter,
  pending,
  placeholder = "User Name",
}: {
  onFilter: (name: string) => void;
  pending: boolean;
  placeholder?: string;
}) {
  const { register, handleSubmit } = useForm({
    resolver: yupResolver(filterSchema),
    defaultValues: { name: "" },
  });
  const id = useId();
  return (
    <form
      role="search"
      className={styles.filter}
      onSubmit={handleSubmit((values) => onFilter(values.name.trim()))}
    >
      <label className="srOnly" htmlFor={id}>
        Search by name
      </label>
      <input
        id={id}
        {...register("name")}
        placeholder={placeholder}
        type="search"
        autoComplete="off"
      />
      <Button type="submit" pending={pending}>
        <Icon name="filter" />
        Filter
      </Button>
    </form>
  );
}
export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      {pageWindow(page, pages).map((value) => (
        <button
          type="button"
          key={value}
          aria-label={`Page ${value}`}
          aria-current={value === page ? "page" : undefined}
          onClick={() => onPage(value)}
        >
          <Icon name={value === page ? "pagination-active" : "pagination-default"} />
        </button>
      ))}
    </nav>
  );
}
export function Modal({
  title,
  children,
  onDismiss,
  compact = false,
  busy = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  compact?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    element?.querySelector<HTMLElement>("input, [role=combobox]")?.focus();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      className={`${styles.modal} ${compact ? styles.compact : ""} ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onDismiss();
      }}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Close dialog"
        disabled={busy}
        onClick={onDismiss}
      >
        <Icon name="close" size={24} />
      </button>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}
export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  onBlur,
  invalid,
  describedBy,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = `${id}-options`;
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlur();
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onBlur]);
  const choose = (index: number) => {
    onChange(options[index]);
    setOpen(false);
    button.current?.focus();
    onBlur();
  };
  return (
    <div ref={root} className={styles.select}>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        className={styles.input}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)));
          setOpen(!open);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) onBlur();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive((current) =>
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : Math.max(
                      0,
                      Math.min(options.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)),
                    ),
            );
          }
          if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            choose(active);
          }
          if (event.key === "Tab") setOpen(false);
        }}
      >
        <span className={!value ? styles.placeholder : ""}>{value || label}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label} className={styles.options}>
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={value === option}
              className={active === index ? styles.optionActive : ""}
              onPointerMove={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function Avatar({
  name,
  photo,
  product = false,
}: {
  name: string;
  photo: string | null;
  product?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = photo && /^https:\/\//i.test(photo) ? photo : null;
  return (
    <span className={`${styles.avatar} ${product ? styles.productAvatar : ""}`}>
      {safe && failed !== safe ? (
        <img
          src={safe}
          alt=""
          width={24}
          height={24}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(safe)}
        />
      ) : (
        <span aria-hidden="true">{name.trim().slice(0, 1)}</span>
      )}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Active" || status === "Completed" || status === "Delivered"
      ? "green"
      : status === "Deactive" || status === "Cancelled"
        ? "red"
        : status === "Confirmed"
          ? "purple"
          : status === "Pending"
            ? "orange"
            : "blue";
  return <span className={`${styles.badge} ${styles[tone]}`}>{status}</span>;
}
