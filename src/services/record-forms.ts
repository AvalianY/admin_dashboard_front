import type { Customer, Product, Supplier } from "../types/api";
export type EditableRecord = Product | Supplier | Customer;
export type RecordKind = "products" | "suppliers" | "customers";
export function recordPayload(
  kind: RecordKind,
  values: Record<string, string>,
  original?: EditableRecord,
) {
  if (kind === "products")
    return {
      name: values.name,
      category: values.category,
      suppliers: values.suppliers,
      stock: Number(values.stock),
      price: values.price,
    };
  if (kind === "suppliers")
    return {
      name: values.name,
      address: values.address,
      company: values.company,
      deliveryDate: values.deliveryDate,
      amount: values.amount === "" ? null : values.amount,
      status: values.status,
    };
  const profile = {
    name: values.name,
    email: values.email,
    address: values.address,
    phone: values.phone,
    country: values.country || null,
  };
  if (!original) return profile;
  return Object.fromEntries(
    Object.entries(profile).filter(
      ([key, value]) => (original as Customer)[key as keyof typeof profile] !== value,
    ),
  );
}
