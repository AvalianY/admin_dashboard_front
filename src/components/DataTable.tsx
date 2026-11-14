import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader, Notice } from "./ui";
import styles from "./table.module.css";

export interface Column<T> {
  key: string;
  title: string;
  width: number;
  render: (row: T) => ReactNode;
  sort?: string;
}
export function DataTable<T extends { id: string }>({
  title,
  columns,
  rows,
  loading,
  error,
  reload,
  sort,
  onSort,
  footer = true,
  onRow,
  className = "",
}: {
  title: string;
  columns: Column<T>[];
  rows: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  sort?: { key: string; order: "asc" | "desc" };
  onSort?: (key: string) => void;
  footer?: boolean;
  onRow?: (row: T) => void;
  className?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const width = columns.reduce((total, column) => total + column.width, 0);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setScrollable(element.scrollWidth > element.clientWidth),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);
  return (
    <>
      <section className={`${styles.section} ${className}`} aria-label={title}>
        <div
          className={styles.viewport}
          ref={viewport}
          tabIndex={0}
          aria-label={`${title}, scroll horizontally to see all columns`}
          onScroll={(event) => {
            const element = event.currentTarget;
            const range = element.scrollWidth - element.clientWidth;
            setPosition(range > 0 ? Math.round((element.scrollLeft / range) * 1000) : 0);
          }}
        >
          <div className={styles.panel} style={{ width }}>
            <h2>{title}</h2>
            <table className={styles.table}>
              <colgroup>
                {columns.map((column) => (
                  <col key={column.key} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        column.sort && sort?.key === column.sort
                          ? sort.order === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {column.sort && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(column.sort!)}
                          title={`Sort by ${column.title}`}
                        >
                          {column.title}
                        </button>
                      ) : (
                        column.title
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  !error &&
                  rows.map((row) => (
                    <tr key={row.id}>
                      {columns.map((column, index) => (
                        <td key={column.key}>
                          {index === 0 && onRow ? (
                            <button className={styles.rowLink} onClick={() => onRow(row)}>
                              {column.render(row)}
                            </button>
                          ) : (
                            column.render(row)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
            {loading ? (
              <div className={styles.tableState}>
                <Loader />
                <p>The server may be waking up…</p>
              </div>
            ) : error ? (
              <div className={styles.tableState}>
                <Notice error retry={reload}>
                  {error}
                </Notice>
              </div>
            ) : rows.length === 0 ? (
              <div className={styles.tableState}>
                <Notice>No results found.</Notice>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      {footer && (
        <div className={styles.scrollFooter}>
          <input
            type="range"
            className={styles.scrollbar}
            aria-label={`Horizontal scroll for ${title}`}
            min={0}
            max={1000}
            step={1}
            value={position}
            aria-valuetext={`${Math.round(position / 10)}%`}
            disabled={!scrollable}
            onChange={(event) => {
              const value = Number(event.target.value);
              setPosition(value);
              const element = viewport.current;
              if (element)
                element.scrollLeft = (value / 1000) * (element.scrollWidth - element.clientWidth);
            }}
          />
        </div>
      )}
    </>
  );
}
