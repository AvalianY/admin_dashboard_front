import { useState } from "react";
import { useResource } from "../hooks/useResource";
import type { Counts, Customer, Dashboard as DashboardData } from "../types/api";
import { DataTable, type Column } from "../components/DataTable";
import { Avatar, Button, Modal, Notice } from "../components/ui";
import { Icon } from "../components/Icon";
import { formatAmount, formatDate, unknown } from "../utils/format";
import styles from "./dashboard.module.css";
import table from "../components/table.module.css";

const counters: { key: keyof Counts; label: string; icon: "money" | "customers-stat" }[] = [
  { key: "products", label: "All products", icon: "money" },
  { key: "suppliers", label: "All suppliers", icon: "money" },
  { key: "customers", label: "All Customers", icon: "customers-stat" },
];
const columns: Column<Customer>[] = [
  {
    key: "name",
    title: "Name",
    width: 105,
    render: (row) => (
      <span className={table.person}>
        <Avatar name={row.name} photo={row.photo} />
        <span>{row.name}</span>
      </span>
    ),
  },
  { key: "email", title: "Email", width: 151, render: (row) => row.email },
  { key: "spent", title: "Spent", width: 79, render: (row) => formatAmount(row.spent) },
];
export function Dashboard() {
  const result = useResource<DashboardData>("/dashboard");
  const [metric, setMetric] = useState<keyof Counts | null>(null);
  const data = result.data;
  const period = result.meta?.periods?.last30Days;
  return (
    <main id="main" className={styles.dashboard}>
      <section aria-label="Overview" className={styles.stats}>
        {counters.map((counter) => (
          <button
            key={counter.key}
            className={styles.stat}
            aria-label={`${counter.label}: ${data?.totals[counter.key] ?? unknown}. View last 30 days`}
            aria-haspopup="dialog"
            onClick={() => setMetric(counter.key)}
          >
            <span className={styles.statLabel}>
              <Icon name={counter.icon} size={18} />
              <span>{counter.label}</span>
            </span>
            <strong>{data ? data.totals[counter.key].toLocaleString("en") : unknown}</strong>
          </button>
        ))}
      </section>
      <div className={styles.recent}>
        <DataTable
          title="Recent Customers"
          columns={columns}
          rows={data?.recentCustomers ?? []}
          loading={result.loading}
          error={result.error}
          reload={result.reload}
        />
      </div>
      <section className={styles.finance} aria-labelledby="finance-title">
        <h2 id="finance-title">Income/Expenses</h2>
        <div className={styles.financeBody}>
          <p className={styles.today}>
            Today <span className="srOnly">(UTC, EUR)</span>
          </p>
          {result.loading ? (
            <Notice>Loading financial records…</Notice>
          ) : result.error ? (
            <Notice error retry={result.reload}>
              {result.error}
            </Notice>
          ) : !data?.incomeExpensesToday?.length ? (
            <Notice>{unknown}</Notice>
          ) : (
            <ul className={styles.transactions}>
              {data?.incomeExpensesToday.map((row) => (
                <li key={row.id} className={styles[row.type]}>
                  <span className={styles.transactionType}>{row.type}</span>
                  <p>{row.name}</p>
                  <span
                    className={styles.amount}
                    aria-label={`${row.type === "Expense" ? "minus" : "plus"} ${row.amount} ${row.currency}`}
                  >
                    {row.type === "Expense" ? "-" : "+"}
                    {formatAmount(row.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {metric && (
        <Modal title="Last 30 days" onDismiss={() => setMetric(null)} compact>
          <div className={styles.metric}>
            <h3>{counters.find((counter) => counter.key === metric)?.label}</h3>
            <strong>
              {data?.last30Days[metric] === null && metric !== "customers"
                ? 0
                : (data?.last30Days[metric] ?? unknown)}
            </strong>
            {period && (
              <p>
                {formatDate(period.from)} –{" "}
                {formatDate(new Date(Date.parse(period.toExclusive) - 1).toISOString())} (UTC)
              </p>
            )}
            <Button variant="secondary" onClick={() => setMetric(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
