export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "demo" | null;
}
export interface Session {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: User;
}
export interface Meta {
  completeness: "complete" | "partial";
  missingData: string[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  periods?: { last30Days: Period; today: Period };
}
export interface Period {
  from: string;
  toExclusive: string;
  timeZone: "UTC";
}
export interface Envelope<T> {
  data: T;
  meta?: Meta;
}
interface RecordDates {
  createdAt: string | null;
  updatedAt: string | null;
}
export interface Product extends RecordDates {
  id: string;
  legacyId: string | null;
  name: string;
  photo: string | null;
  category: string;
  stock: number;
  suppliers: string;
  price: string;
  currency: "EUR";
}
export interface Supplier extends RecordDates {
  id: string;
  name: string;
  address: string;
  company: string;
  deliveryDate: string;
  amount: string | null;
  currency: "EUR";
  legacyMoney: { amount: string; currency: "BDT" } | null;
  status: "Active" | "Deactive";
}
export interface Customer extends RecordDates {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  country: string | null;
  photo: string | null;
  registerDate: string;
  spent: string;
  currency: "EUR";
}
export interface OrderItem {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string | null;
  amount: string | null;
  currency: "EUR";
}
export type OrderStatus =
  "Completed" | "Confirmed" | "Pending" | "Cancelled" | "Processing" | "Shipped" | "Delivered";
export interface Order extends RecordDates {
  id: string;
  name: string;
  photo: string | null;
  address: string;
  productUnits: number;
  price: string;
  currency: "EUR";
  status: OrderStatus;
  orderDate: string | null;
  customerId: string | null;
  items: OrderItem[] | null;
}
export interface Transaction extends RecordDates {
  id: string;
  name: string;
  amount: string;
  currency: "EUR";
  type: "Income" | "Expense" | "Error";
  businessDate: string | null;
  customerId: string | null;
  customerEmail: string | null;
}
export type HistoryEntry = { id: string; customerId: string; date: string | null } & (
  { type: "order"; details: Order } | { type: "transaction"; details: Transaction }
);
export interface CustomerDetails {
  customer: Customer;
  history: HistoryEntry[] | null;
}
export interface Counts {
  products: number;
  suppliers: number;
  customers: number;
}
export interface Dashboard {
  user: User;
  totals: Counts;
  last30Days: { [K in keyof Counts]: number | null };
  recentCustomers: Customer[];
  incomeExpensesToday: Transaction[] | null;
}
export interface ProductList {
  items: Product[];
  categories: string[];
}
export interface ItemList<T> {
  items: T[];
}
export type Collection = "products" | "suppliers" | "customers" | "orders";
