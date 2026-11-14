import { useResource } from "../hooks/useResource";
import type { CustomerDetails as Details } from "../types/api";
import { formatAmount, formatDate, unknown } from "../utils/format";
import { Button, Loader, Modal, Notice, StatusBadge } from "./ui";
import styles from "./forms.module.css";

export function CustomerDetails({
  id,
  onDismiss,
  onEdit,
}: {
  id: string;
  onDismiss: () => void;
  onEdit: (customer: Details["customer"]) => void;
}) {
  const result = useResource<Details>(`/customers/${id}`);
  const customer = result.data?.customer;
  return (
    <Modal title="Customer details" onDismiss={onDismiss}>
      <div className={styles.details}>
        {result.loading ? (
          <Loader />
        ) : result.error ? (
          <Notice error retry={result.reload}>
            {result.error}
          </Notice>
        ) : (
          customer && (
            <>
              <dl>
                <dt>Name</dt>
                <dd>{customer.name}</dd>
                <dt>Email</dt>
                <dd>{customer.email}</dd>
                <dt>Address</dt>
                <dd>{customer.address}</dd>
                <dt>Phone</dt>
                <dd>{customer.phone}</dd>
                <dt>Country</dt>
                <dd>{customer.country ?? unknown}</dd>
                <dt>Registered</dt>
                <dd>{formatDate(customer.registerDate)}</dd>
                <dt>Spent</dt>
                <dd>{formatAmount(customer.spent, customer.currency)}</dd>
              </dl>
              <h3>History</h3>
              {!result.data?.history?.length ? (
                <p>{unknown}</p>
              ) : (
                <ul className={styles.history}>
                  {result.data?.history.map((entry) => (
                    <li key={`${entry.type}-${entry.id}`}>
                      <p>
                        {entry.type === "order" ? "Order" : entry.details.type} ·{" "}
                        {formatDate(entry.date)}
                      </p>
                      {entry.type === "order" ? (
                        <>
                          <p>
                            {entry.details.name} · <StatusBadge status={entry.details.status} />
                          </p>
                          <p>
                            {entry.details.productUnits} units ·{" "}
                            {formatAmount(entry.details.price, entry.details.currency)}
                          </p>
                          {entry.details.items === null ? (
                            <p>Items: {unknown}</p>
                          ) : (
                            <ul>
                              {entry.details.items.map((item, index) => (
                                <li key={`${item.productId ?? item.productName}-${index}`}>
                                  {item.productName} × {item.quantity}:{" "}
                                  {formatAmount(item.amount, item.currency)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <p>
                          {entry.details.name} ·{" "}
                          {formatAmount(entry.details.amount, entry.details.currency)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.actions}>
                <Button onClick={() => onEdit(customer)}>Edit</Button>
                <Button variant="secondary" onClick={onDismiss}>
                  Close
                </Button>
              </div>
            </>
          )
        )}
      </div>
    </Modal>
  );
}
