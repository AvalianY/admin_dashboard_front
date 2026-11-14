import * as yup from "yup";

export const categories = [
  "Medicine",
  "Head",
  "Hand",
  "Dental Care",
  "Skin Care",
  "Eye Care",
  "Vitamins & Supplements",
  "Orthopedic Products",
  "Baby Care",
];
export const emailPattern =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;
const text = () => yup.string().trim().required("This field is required.");
const email = () =>
  yup.string().required("Email is required.").matches(emailPattern, "Enter a valid email address.");
export const loginSchema = yup
  .object({ email: email(), password: yup.string().required("Password is required.") })
  .noUnknown();
export const filterSchema = yup.object({ name: yup.string().defined() });
export const isCalendarDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value + "T00:00:00.000Z")) &&
  new Date(value + "T00:00:00.000Z").toISOString().slice(0, 10) === value;
const money = (allowUnknown: boolean) =>
  yup
    .string()
    .trim()
    .defined()
    .test(
      "decimal",
      "Enter a non-negative decimal amount.",
      (value) => (allowUnknown && value === "") || /^\d+(?:\.\d+)?$/.test(value),
    );
const recordSchema = (shape: Record<string, yup.StringSchema<string>>) =>
  yup.object(shape).noUnknown();
export function productSchema(currentCategory?: string) {
  return recordSchema({
    name: text(),
    category: text().oneOf(
      [
        ...categories,
        ...(currentCategory && !categories.includes(currentCategory) ? [currentCategory] : []),
      ],
      "Select an available category.",
    ),
    suppliers: text(),
    stock: text().test(
      "stock",
      "Enter a non-negative safe integer.",
      (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)),
    ),
    price: money(false),
  });
}
export function supplierSchema(allowUnknown: boolean) {
  return recordSchema({
    name: text(),
    address: text(),
    company: text(),
    deliveryDate: text().test("calendar", "Choose a valid date.", isCalendarDate),
    amount: money(allowUnknown),
    status: text().oneOf(["Active", "Deactive"], "Select a status."),
  });
}
export const customerSchema = recordSchema({
  name: text(),
  email: email(),
  address: text(),
  phone: text(),
  country: yup.string().trim().defined(),
});
