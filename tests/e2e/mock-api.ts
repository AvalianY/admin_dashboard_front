import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import type {
  Customer,
  Dashboard,
  Order,
  Product,
  Session,
  Supplier,
  Transaction,
} from "../../src/types/api";

// Synthetic acceptance data only. No original dataset or production credentials.
export const user = {
  id: "000000000000000000000001",
  name: "Test administrator",
  email: "admin@example.test",
};
const dates = { createdAt: null, updatedAt: null };
const id = (prefix: number, index: number) => String(prefix * 1000 + index).padStart(24, "0");
export const makeSession = (): Session => ({
  user,
  accessToken: randomUUID(),
  tokenType: "Bearer",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
});
export const makeCustomers = (): Customer[] =>
  Array.from({ length: 88 }, (_, index) => ({
    id: id(3, index),
    name: `Customer ${String(index + 1).padStart(2, "0")}`,
    email: `customer${index + 1}@example.test`,
    address: "12 Example Street",
    phone: "+49 000 0000",
    country: null,
    photo: null,
    registerDate: "2030-01-01",
    spent: "150.00",
    currency: "EUR",
    ...dates,
  }));
export const makeProducts = (): Product[] =>
  Array.from({ length: 60 }, (_, index) => ({
    id: id(1, index),
    legacyId: "duplicate-source-id",
    name: `Product ${String(index + 1).padStart(2, "0")}`,
    category: index === 1 ? "Heart" : index === 2 ? "Leg" : "Medicine",
    suppliers: "Example Co",
    stock: 12,
    price: "147.50",
    currency: "EUR",
    photo: null,
    ...dates,
  }));
export const makeSuppliers = (): Supplier[] =>
  Array.from({ length: 5 }, (_, index) => ({
    id: id(2, index),
    name: `Supplier ${index + 1}`,
    address: "12 Example Street",
    company: "Example Co",
    deliveryDate: "2030-01-01",
    amount: index === 0 ? null : "100.00",
    legacyMoney: index === 0 ? { amount: "1250.50", currency: "BDT" } : null,
    status: index % 2 ? "Deactive" : "Active",
    currency: "EUR",
    ...dates,
  }));
export const makeOrders = (): Order[] =>
  Array.from({ length: 25 }, (_, index) => ({
    id: id(4, index),
    name: `Customer ${index + 1}`,
    address: "12 Example Street",
    productUnits: 3,
    price: "105.50",
    currency: "EUR",
    status: (
      [
        "Completed",
        "Confirmed",
        "Pending",
        "Cancelled",
        "Processing",
        "Shipped",
        "Delivered",
      ] as const
    )[index % 7],
    orderDate: index === 0 ? null : "2030-01-01",
    customerId: null,
    items: null,
    photo: null,
    ...dates,
  }));
export async function authenticate(page: Page, session = makeSession()) {
  await page.goto("/login");
  await page.evaluate(
    (value) => sessionStorage.setItem("epharmacy.session", JSON.stringify(value)),
    session,
  );
  return session;
}
export interface Captured {
  method: string;
  path: string;
  query: Record<string, string>;
  body: Record<string, unknown> | null;
}
export async function mockApi(
  page: Page,
  options: { finance?: boolean; dashboard?: Partial<Dashboard> } = {},
) {
  const products = makeProducts();
  const suppliers = makeSuppliers();
  const customers = makeCustomers();
  const orders = makeOrders();
  const requests: Captured[] = [];
  const historyCustomerId = customers[1].id;
  const partial = { completeness: "partial", missingData: ["historicalData"] };
  const complete = { completeness: "complete", missingData: [] };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(4);
    const method = request.method();
    const body = request.postDataJSON() as Record<string, unknown> | null;
    requests.push({ method, path, query: Object.fromEntries(url.searchParams), body });
    const reply = (data: unknown, meta: unknown = complete, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ data, meta }),
      });
    if (path === "/user/login") return reply(makeSession());
    if (path === "/user/user-info") return reply(user);
    if (path === "/user/logout") return route.fulfill({ status: 204 });
    if (path === "/dashboard") {
      const finance: Transaction[] | null = options.finance
        ? ["Expense", "Income", "Income", "Income", "Error", "Expense"].map((type, index) => ({
            id: id(5, index),
            name:
              index % 3 === 1 ? "Example Market Ltd 12 Example Street Berlin" : "Example billing",
            amount: "49.88",
            currency: "EUR",
            type: type as Transaction["type"],
            businessDate: "2030-01-30",
            customerId: null,
            customerEmail: null,
            ...dates,
          }))
        : null;
      return reply(
        {
          user,
          totals: {
            products: products.length,
            suppliers: suppliers.length,
            customers: customers.length,
          },
          last30Days: { products: null, suppliers: null, customers: 0 },
          recentCustomers: customers.slice(0, 5),
          incomeExpensesToday: finance,
          ...options.dashboard,
        },
        {
          ...partial,
          periods: {
            last30Days: {
              from: "2030-01-01T00:00:00.000Z",
              toExclusive: "2030-01-31T00:00:00.000Z",
              timeZone: "UTC",
            },
            today: {
              from: "2030-01-30T00:00:00.000Z",
              toExclusive: "2030-01-31T00:00:00.000Z",
              timeZone: "UTC",
            },
          },
        },
      );
    }
    const segments = path.split("/").filter(Boolean);
    const kind = segments[0];
    const recordId = segments[1];
    const collection =
      kind === "products"
        ? products
        : kind === "suppliers"
          ? suppliers
          : kind === "customers"
            ? customers
            : kind === "orders"
              ? orders
              : null;
    if (!collection)
      return route.fulfill({
        status: 404,
        json: { error: { code: "NOT_FOUND", message: "Unmatched mock route." } },
      });
    if (method === "GET" && recordId && kind === "customers") {
      const customer = customers.find((row) => row.id === recordId);
      return reply(
        {
          customer,
          history:
            recordId === historyCustomerId
              ? [
                  {
                    id: orders[1].id,
                    customerId: recordId,
                    type: "order",
                    date: "2030-01-01",
                    details: {
                      ...orders[1],
                      customerId: recordId,
                      items: [
                        {
                          productId: products[0].id,
                          productName: products[0].name,
                          quantity: 3,
                          unitPrice: "35.166",
                          amount: "105.50",
                          currency: "EUR",
                        },
                      ],
                    },
                  },
                ]
              : null,
        },
        partial,
      );
    }
    if (method === "GET" && !recordId) {
      let items = collection.filter((row) =>
        row.name.toLowerCase().includes((url.searchParams.get("name") ?? "").toLowerCase()),
      );
      const sortBy = url.searchParams.get("sortBy");
      if (sortBy === "name")
        items = [...items].sort(
          (a, b) =>
            a.name.localeCompare(b.name) * (url.searchParams.get("sortOrder") === "asc" ? 1 : -1),
        );
      if (kind === "customers") {
        const pageNumber = Number(url.searchParams.get("page") ?? 1);
        const limit = Number(url.searchParams.get("limit") ?? 20);
        return reply(
          { items: items.slice((pageNumber - 1) * limit, pageNumber * limit) },
          {
            ...partial,
            pagination: {
              page: pageNumber,
              limit,
              total: items.length,
              totalPages: Math.ceil(items.length / limit),
            },
          },
        );
      }
      return reply(
        kind === "products" ? { items, categories: ["Medicine", "Heart", "Leg"] } : { items },
        kind === "products" ? complete : partial,
      );
    }
    if (method === "DELETE" && kind === "products") {
      products.splice(
        products.findIndex((row) => row.id === recordId),
        1,
      );
      return route.fulfill({ status: 204 });
    }
    if (method === "POST") {
      const newRecord = {
        ...collection[0],
        ...body,
        id: id(9, collection.length),
        createdAt: "2030-01-30T12:00:00.000Z",
        updatedAt: "2030-01-30T12:00:00.000Z",
        ...(kind === "customers"
          ? { photo: null, spent: "0", registerDate: "2030-01-30", country: body?.country ?? null }
          : {}),
      };
      // Each mock collection has its own domain type; input is checked by acceptance assertions.
      (collection as unknown[]).unshift(newRecord);
      return reply(newRecord, complete, 201);
    }
    if (method === "PUT" || method === "PATCH") {
      const target = collection.find((row) => row.id === recordId);
      if (target) Object.assign(target, body);
      return reply(target);
    }
    return route.fulfill({
      status: 400,
      json: {
        error: { code: "UNEXPECTED_MOCK_REQUEST", message: "This operation is not supported." },
      },
    });
  });
  return { requests, products, suppliers, customers, orders };
}
