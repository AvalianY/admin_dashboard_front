import { useState } from "react";
import { useResource } from "../hooks/useResource";
import type {
  Collection,
  Customer,
  ItemList,
  Order,
  Product,
  ProductList,
  Supplier,
} from "../types/api";
import type { EditableRecord, RecordKind } from "../services/record-forms";
import { DataTable, type Column } from "../components/DataTable";
import { Avatar, Button, FilterBar, Pagination, StatusBadge } from "../components/ui";
import { RecordForm, DeleteProduct } from "../components/RecordForm";
import { CustomerDetails } from "../components/CustomerDetails";
import { Icon } from "../components/Icon";
import { formatAmount, formatDate, unknown } from "../utils/format";
import styles from "./records.module.css";
import table from "../components/table.module.css";

type Row = Product | Supplier | Customer | Order;
type DialogState =
  | { type: "form"; original?: EditableRecord }
  | { type: "delete"; product: Product }
  | { type: "details"; id: string }
  | null;
export function Records({ kind }: { kind: Collection }) {
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: kind === "orders" ? "orderDate" : "createdAt",
    order: "desc",
  });
  const [dialog, setDialog] = useState<DialogState>(null);
  const query = new URLSearchParams();
  if (name) query.set("name", name);
  if (kind === "customers") {
    query.set("page", String(page));
    query.set("limit", "5");
  }
  if (kind === "products" || kind === "orders") {
    query.set("sortBy", sort.key);
    query.set("sortOrder", sort.order);
  }
  const result = useResource<ProductList | ItemList<Row>>(
    `/${kind}${query.size ? `?${query}` : ""}`,
  );
  const items = result.data?.items ?? [];
  const pages =
    kind === "customers" ? (result.meta?.pagination?.totalPages ?? 0) : Math.ceil(items.length / 5);
  const currentPage = Math.max(1, Math.min(page, pages || 1));
  const visible =
    kind === "customers" ? items : items.slice((currentPage - 1) * 5, currentPage * 5);
  const edit = (original: EditableRecord) => setDialog({ type: "form", original });
  const person = (row: Row) => (
    <span className={table.person}>
      <Avatar
        name={row.name}
        photo={"photo" in row ? row.photo : null}
        product={kind === "products"}
      />
      <span>{row.name}</span>
    </span>
  );
  const editAction = (row: EditableRecord, round = false) => (
    <button
      type="button"
      className={round ? table.roundAction : table.edit}
      aria-label={`Edit ${row.name}`}
      onClick={() => edit(row)}
    >
      <Icon name="edit" size={round ? 16 : 14} />
      {!round && "Edit"}
    </button>
  );
  let columns: Column<Row>[];
  if (kind === "products")
    columns = [
      { key: "name", title: "Product Info", width: 126, render: (row) => row.name, sort: "name" },
      {
        key: "category",
        title: "Category",
        width: 78,
        render: (row) => (row as Product).category,
        sort: "category",
      },
      {
        key: "stock",
        title: "Stock",
        width: 57,
        render: (row) => (row as Product).stock,
        sort: "stock",
      },
      {
        key: "suppliers",
        title: "Suppliers",
        width: 78,
        render: (row) => (row as Product).suppliers,
        sort: "suppliers",
      },
      {
        key: "price",
        title: "Price",
        width: 69,
        render: (row) => formatAmount((row as Product).price),
        sort: "price",
      },
      {
        key: "action",
        title: "Action",
        width: 103,
        render: (row) => (
          <span className={table.actions}>
            {editAction(row as Product, true)}
            <button
              className={`${table.roundAction} ${table.danger}`}
              aria-label={`Delete ${row.name}`}
              onClick={() => setDialog({ type: "delete", product: row as Product })}
            >
              <Icon name="trash" />
            </button>
          </span>
        ),
      },
    ];
  else if (kind === "suppliers")
    columns = [
      { key: "name", title: "Suppliers Info", width: 108, render: (row) => row.name },
      { key: "address", title: "Address", width: 94, render: (row) => (row as Supplier).address },
      { key: "company", title: "Company", width: 83, render: (row) => (row as Supplier).company },
      {
        key: "date",
        title: "Delivery date",
        width: 115,
        render: (row) => formatDate((row as Supplier).deliveryDate),
      },
      {
        key: "amount",
        title: "Ammount",
        width: 88,
        render: (row) => (
          <span className={styles.amount}>
            {formatAmount((row as Supplier).amount ?? (row as Supplier).legacyMoney?.amount)}
          </span>
        ),
      },
      {
        key: "status",
        title: "Status",
        width: 90,
        render: (row) => <StatusBadge status={(row as Supplier).status} />,
      },
      { key: "action", title: "Action", width: 100, render: (row) => editAction(row as Supplier) },
    ];
  else if (kind === "customers")
    columns = [
      { key: "name", title: "User Info", width: 108, render: person },
      { key: "email", title: "Email", width: 161, render: (row) => (row as Customer).email },
      { key: "address", title: "Address", width: 120, render: (row) => (row as Customer).address },
      { key: "phone", title: "Phone", width: 148, render: (row) => (row as Customer).phone },
      {
        key: "date",
        title: "Register date",
        width: 133,
        render: (row) => formatDate((row as Customer).registerDate),
      },
      { key: "action", title: "Action", width: 100, render: (row) => editAction(row as Customer) },
    ];
  else
    columns = [
      { key: "name", title: "User Info", width: 128, render: person, sort: "name" },
      {
        key: "address",
        title: "Address",
        width: 110,
        render: (row) => (row as Order).address,
        sort: "address",
      },
      {
        key: "units",
        title: "Products",
        width: 96,
        render: (row) => (row as Order).productUnits,
        sort: "productUnits",
      },
      {
        key: "date",
        title: "Order date",
        width: 121,
        render: (row) =>
          (row as Order).orderDate ? formatDate((row as Order).orderDate) : unknown,
        sort: "orderDate",
      },
      {
        key: "price",
        title: "Price",
        width: 85,
        render: (row) => formatAmount((row as Order).price),
        sort: "price",
      },
      {
        key: "status",
        title: "Status",
        width: 131,
        render: (row) => <StatusBadge status={(row as Order).status} />,
        sort: "status",
      },
    ];
  const saved = () => {
    setDialog(null);
    if (kind === "customers") setPage(1);
    result.reload();
  };
  const addText =
    kind === "products"
      ? "Add a new product"
      : kind === "suppliers"
        ? "Add a new suppliers"
        : "Add Customers";
  return (
    <main id="main" className={`${styles.records} ${kind === "products" ? styles.products : ""}`}>
      <FilterBar
        pending={result.loading}
        placeholder={kind === "products" ? "Product Name" : "User Name"}
        onFilter={(value) => {
          setName(value);
          setPage(1);
          if (value === name) result.reload();
        }}
      />
      {kind !== "orders" && (
        <div className={styles.addRow}>
          {kind === "products" ? (
            <button
              type="button"
              className={styles.addProduct}
              onClick={() => setDialog({ type: "form" })}
            >
              <span>
                <Icon name="add" />
              </span>
              {addText}
            </button>
          ) : (
            <Button
              variant="outline"
              className={styles.add}
              onClick={() => setDialog({ type: "form" })}
            >
              {addText}
            </Button>
          )}
        </div>
      )}
      <DataTable
        className={styles.tableGap}
        title={kind === "customers" ? "Customers Data" : `All ${kind}`}
        columns={columns}
        rows={visible}
        loading={result.loading}
        error={result.error}
        reload={result.reload}
        sort={sort}
        onSort={(key) => {
          setSort({ key, order: sort.key === key && sort.order === "asc" ? "desc" : "asc" });
          setPage(1);
        }}
        onRow={
          kind === "customers" ? (row) => setDialog({ type: "details", id: row.id }) : undefined
        }
      />
      <Pagination page={currentPage} pages={pages} onPage={setPage} />
      {dialog?.type === "form" && kind !== "orders" && (
        <RecordForm
          kind={kind as RecordKind}
          original={dialog.original}
          onDismiss={() => setDialog(null)}
          onSaved={saved}
        />
      )}
      {dialog?.type === "delete" && (
        <DeleteProduct
          product={dialog.product}
          onDismiss={() => setDialog(null)}
          onDeleted={saved}
        />
      )}
      {dialog?.type === "details" && (
        <CustomerDetails id={dialog.id} onDismiss={() => setDialog(null)} onEdit={edit} />
      )}
    </main>
  );
}
