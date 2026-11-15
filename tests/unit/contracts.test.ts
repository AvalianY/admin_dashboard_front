import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, validationMessages } from "../../src/services/api";
import {
  customerSchema,
  isCalendarDate,
  loginSchema,
  productSchema,
  supplierSchema,
} from "../../src/services/validation";
import { readSession } from "../../src/services/session";
import { recordPayload } from "../../src/services/record-forms";
import { formatAmount, formatDate, pageWindow } from "../../src/utils/format";
import type { Customer } from "../../src/types/api";

afterEach(() => vi.unstubAllGlobals());
describe("API boundary", () => {
  it("uses relative API, keeps Bearer out of URL and serializes an explicit JSON payload", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: { id: "example" } })));
    vi.stubGlobal("fetch", fetch);
    await api("/customers", {
      method: "POST",
      token: "synthetic-session",
      body: { name: "Example" },
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/customers",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer synthetic-session",
          "Content-Type": "application/json",
        },
        body: '{"name":"Example"}',
        credentials: "omit",
        cache: "no-store",
      }),
    );
  });
  it("accepts 204 without parsing JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await api("/user/logout")).toEqual({ data: undefined });
  });
  it("preserves null statistics and completeness metadata in the API response", async () => {
    const envelope = {
      data: { last30Days: { products: null, suppliers: null, customers: 0 } },
      meta: { completeness: "partial", missingData: ["last30Days.products.createdAt"] },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(envelope))));
    expect(await api("/dashboard")).toEqual(envelope);
  });
  it.each([400, 401, 403, 404, 409, 500])(
    "preserves safe error status %i and field details",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              error: {
                code: "TEST",
                message: "Request failed",
                details: [{ path: "name", message: "Required" }],
              },
            }),
            { status },
          ),
        ),
      );
      await expect(api("/products")).rejects.toMatchObject({
        status,
        code: "TEST",
        message: "Request failed",
      });
    },
  );
  it("handles malformed/non-JSON and network failures without leaking underlying transport details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream stack", { status: 502 })),
    );
    await expect(api("/products")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private transport details")));
    await expect(api("/products")).rejects.toEqual(
      new ApiError(0, "NETWORK_ERROR", "The server could not be reached. Please try again."),
    );
  });
  it("preserves abort without retrying", async () => {
    const controller = new AbortController();
    controller.abort();
    const failure = new DOMException("Aborted", "AbortError");
    const fetch = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal("fetch", fetch);
    await expect(api("/products", { signal: controller.signal })).rejects.toBe(failure);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([null, [], "not an envelope", 42, { meta: {} }])(
    "rejects a malformed JSON envelope without a native TypeError: %j",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
      await expect(api("/products")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    },
  );
  it("maps actual backend dot paths and structured field errors", () => {
    expect(
      validationMessages([
        { path: "price", message: "Invalid decimal" },
        { path: "items.0", message: "Invalid item" },
      ]),
    ).toEqual({ price: "Invalid decimal", items: "Invalid item" });
    expect(validationMessages({ fieldErrors: { name: ["Required"] } })).toEqual({
      name: "Required",
    });
  });
});
describe("validation follows API, including historical exceptions", () => {
  const product = {
    name: "Example",
    category: "Medicine",
    suppliers: "Company",
    stock: "0",
    price: "0.0000000000000000001",
  };
  it("does not impose a new password length or trim password/email", async () => {
    expect(await loginSchema.validate({ email: "a@example.test", password: " " })).toEqual({
      email: "a@example.test",
      password: " ",
    });
    await expect(
      loginSchema.validate({ email: " a@example.test", password: "x" }),
    ).rejects.toThrow();
  });
  it("allows legacy category only when retaining the current one", async () => {
    expect(await productSchema("Heart").isValid({ ...product, category: "Heart" })).toBe(true);
    expect(await productSchema("Heart").isValid({ ...product, category: "Leg" })).toBe(false);
    expect(await productSchema().isValid({ ...product, category: "Heart" })).toBe(false);
    expect(await productSchema("Heart").isValid(product)).toBe(true);
  });
  it.each(["-1", "1.5", "9007199254740992", "Infinity"])(
    "rejects invalid stock %s",
    async (stock) => {
      expect(await productSchema().isValid({ ...product, stock })).toBe(false);
    },
  );
  it.each(["-1", "1,5", "1e3", "", "NaN"])("rejects invalid money %s", async (price) => {
    expect(await productSchema().isValid({ ...product, price })).toBe(false);
  });
  it("retains exact decimal strings", async () => {
    expect((await productSchema().validate(product)).price).toBe(product.price);
  });
  it("allows unknown EUR only on an existing unknown supplier", async () => {
    const supplier = {
      name: "Example",
      address: "Street",
      company: "Company",
      deliveryDate: "2030-01-01",
      amount: "",
      status: "Active",
    };
    expect(await supplierSchema(true).isValid(supplier)).toBe(true);
    expect(await supplierSchema(false).isValid(supplier)).toBe(false);
  });
  it("validates real UTC calendar dates", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2030-02-29")).toBe(false);
    expect(isCalendarDate("2030-13-01")).toBe(false);
  });
  it("allows a customer phone without arbitrary format rules and optional country", async () => {
    expect(
      await customerSchema.isValid({
        name: "Example",
        email: "example@example.test",
        address: "Street",
        phone: "local extension 12",
        country: "",
      }),
    ).toBe(true);
  });
});
describe("payload and display invariants", () => {
  it("whitelists customer create fields and never sends server fields", () => {
    expect(
      recordPayload("customers", {
        name: "Example",
        email: "example@example.test",
        address: "Street",
        phone: "123",
        country: "",
        spent: "999",
        id: "forbidden",
      }),
    ).toEqual({
      name: "Example",
      email: "example@example.test",
      address: "Street",
      phone: "123",
      country: null,
    });
  });
  it("sends only changed profile fields on PATCH", () => {
    const values = {
      name: "Example",
      email: "example@example.test",
      address: "Street",
      phone: "123",
      country: "",
    };
    const original = { ...values, country: null } as Customer;
    expect(recordPayload("customers", values, original)).toEqual({});
    expect(recordPayload("customers", { ...values, phone: "456" }, original)).toEqual({
      phone: "456",
    });
  });
  it("does not round large financial values or replace unknown by zero", () => {
    expect(formatAmount("12345678901234567890.123456789")).toBe(
      "12,345,678,901,234,567,890.123456789",
    );
    expect(formatAmount(null)).toBe("—");
    expect(formatAmount("0")).toBe("0");
    expect(formatDate(null)).toBe("—");
  });
  it("creates a sliding window of real pages only", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(7, 18)).toEqual([5, 6, 7, 8, 9]);
    expect(pageWindow(18, 18)).toEqual([14, 15, 16, 17, 18]);
    expect(pageWindow(1, 0)).toEqual([]);
  });
  it("drops expired/corrupt sessions using the actual expiry", () => {
    const removeItem = vi.fn();
    const storage = { getItem: () => "broken JSON", removeItem };
    expect(readSession(storage)).toBeNull();
    expect(removeItem).toHaveBeenCalled();
    const expired = {
      accessToken: "synthetic",
      expiresAt: "2030-01-01T00:00:00Z",
      user: { id: "example" },
    };
    expect(
      readSession(
        { getItem: () => JSON.stringify(expired), removeItem },
        Date.parse("2030-01-01T00:00:00Z"),
      ),
    ).toBeNull();
  });
});
