import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "../app/auth-context";
import { ApiError, api, validationMessages } from "../services/api";
import { categories, customerSchema, productSchema, supplierSchema } from "../services/validation";
import { recordPayload, type EditableRecord, type RecordKind } from "../services/record-forms";
import type { Product, Supplier } from "../types/api";
import { Button, Modal, SelectField } from "./ui";
import { Icon } from "./Icon";
import styles from "./forms.module.css";
import ui from "./ui.module.css";

const fields = {
  products: [
    ["name", "Product Info"],
    ["category", "Category"],
    ["suppliers", "Suppliers"],
    ["stock", "Stock"],
    ["price", "Price"],
  ],
  suppliers: [
    ["name", "Suppliers Info"],
    ["address", "Address"],
    ["company", "Company"],
    ["deliveryDate", "Delivery date"],
    ["amount", "Ammount"],
    ["status", "Status"],
  ],
  customers: [
    ["name", "Customer Info"],
    ["email", "Email address"],
    ["address", "Address"],
    ["phone", "Phone"],
    ["country", "Country (optional)"],
  ],
} as const;
export function RecordForm({
  kind,
  original,
  onDismiss,
  onSaved,
}: {
  kind: RecordKind;
  original?: EditableRecord;
  onDismiss: () => void;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const id = useId();
  const [conflict, setConflict] = useState(false);
  const currentCategory =
    kind === "products" ? (original as Product | undefined)?.category : undefined;
  const schema =
    kind === "products"
      ? productSchema(currentCategory)
      : kind === "suppliers"
        ? supplierSchema(!!original && (original as Supplier).amount === null)
        : customerSchema;
  const defaults = Object.fromEntries(
    fields[kind].map(([key]) => [
      key,
      original ? String((original as unknown as Record<string, unknown>)[key] ?? "") : "",
    ]),
  );
  // All three schemas have string inputs; the explicit serializer below whitelists each API payload.
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({ resolver: yupResolver(schema), defaultValues: defaults });
  const submit = handleSubmit(async (values) => {
    const body = recordPayload(kind, values, original);
    if (Object.keys(body).length === 0) {
      setError("root", { message: "No changes to save." });
      return;
    }
    try {
      await api(`/${kind}${original ? `/${original.id}` : ""}`, {
        token: session?.accessToken,
        method: !original ? "POST" : kind === "customers" ? "PATCH" : "PUT",
        body,
      });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(validationMessages(error.details)))
          if (fields[kind].some(([key]) => key === field)) setError(field, { message });
        setConflict(error.status === 409);
      }
      setError("root", {
        message: error instanceof Error ? error.message : "The record could not be saved.",
      });
    }
  });
  const title = original
    ? "Edit data"
    : kind === "products"
      ? "Add a new product"
      : kind === "suppliers"
        ? "Add a new suppliers"
        : "Add Customers";
  return (
    <Modal title={title} onDismiss={onDismiss} busy={isSubmitting}>
      <form
        noValidate
        onSubmit={submit}
        aria-busy={isSubmitting}
        className={`${styles.form} ${original ? styles.editing : ""} ${original && kind !== "products" ? styles.supplierEdit : ""}`}
      >
        <div className={styles.fields}>
          {fields[kind].map(([key, label]) => {
            const fieldId = `${id}-${key}`;
            const errorId = `${fieldId}-error`;
            const error = errors[key]?.message;
            const options =
              key === "category"
                ? [
                    ...categories,
                    ...(currentCategory && !categories.includes(currentCategory)
                      ? [currentCategory]
                      : []),
                  ]
                : key === "status"
                  ? ["Active", "Deactive"]
                  : null;
            return (
              <div key={key} className={styles.field}>
                <label htmlFor={fieldId} className="srOnly">
                  {label}
                </label>
                {options ? (
                  <Controller
                    name={key}
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        id={fieldId}
                        label={label}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={options}
                        invalid={!!error}
                        describedBy={error ? errorId : undefined}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                ) : (
                  <div className={key === "deliveryDate" ? styles.date : undefined}>
                    <input
                      {...register(key)}
                      id={fieldId}
                      className={ui.input}
                      type={key === "deliveryDate" ? "date" : key === "email" ? "email" : "text"}
                      inputMode={
                        key === "stock"
                          ? "numeric"
                          : ["price", "amount"].includes(key)
                            ? "decimal"
                            : key === "phone"
                              ? "tel"
                              : undefined
                      }
                      placeholder={label}
                      autoComplete={
                        kind === "customers"
                          ? key === "name"
                            ? "name"
                            : key === "email"
                              ? "email"
                              : key === "phone"
                                ? "tel"
                                : key === "country"
                                  ? "country-name"
                                  : "street-address"
                          : "off"
                      }
                      aria-invalid={!!error || undefined}
                      aria-describedby={error ? errorId : undefined}
                      disabled={isSubmitting}
                    />
                    {key === "deliveryDate" && <Icon name="calendar" />}
                  </div>
                )}
                {error && (
                  <p id={errorId} className={ui.fieldError} role="alert">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {errors.root && (
          <p className={`${ui.fieldError} ${styles.serverError}`} role="alert">
            {errors.root.message}
          </p>
        )}
        {conflict && (
          <Button type="button" variant="outline" onClick={onSaved}>
            Reload current data
          </Button>
        )}
        <div className={styles.actions}>
          <Button type="submit" pending={isSubmitting}>
            {original && kind !== "suppliers" ? "Save" : "Add"}
          </Button>
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onDismiss}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function DeleteProduct({
  product,
  onDismiss,
  onDeleted,
}: {
  product: Product;
  onDismiss: () => void;
  onDeleted: () => void;
}) {
  const { session } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await api(`/products/${product.id}`, { method: "DELETE", token: session?.accessToken });
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The product could not be deleted.");
      setPending(false);
    }
  };
  return (
    <Modal title="Delete product" compact onDismiss={onDismiss} busy={pending}>
      <p className={styles.copy}>Delete “{product.name}”?</p>
      {error && (
        <p role="alert" className={ui.fieldError}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button pending={pending} onClick={() => void remove()}>
          Confirm
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onDismiss}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
