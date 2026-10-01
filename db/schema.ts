import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------- Auth.js (Drizzle adapter) ---------- */

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ---------- Customer profile ---------- */

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
  sex: text("sex"),
  age: integer("age"),
  heightCm: integer("height_cm"),
  startWeightKg: real("start_weight_kg"),
  goalWeightKg: real("goal_weight_kg"),
  activity: text("activity"),
  dailyKcalTarget: integer("daily_kcal_target"),
  exclusions: text("exclusions").array().notNull().default(sql`'{}'::text[]`),
  pepperLevel: integer("pepper_level"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kg: real("kg").notNull(),
    loggedOn: date("logged_on").notNull(),
  },
  (t) => [uniqueIndex("weight_logs_user_day").on(t.userId, t.loggedOn)],
);

/* ---------- Catalogue ---------- */

export const productType = pgEnum("product_type", ["plan", "meal", "drink"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  blurb: text("blurb"),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    type: productType("type").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    gallery: text("gallery").array().notNull().default(sql`'{}'::text[]`),
    kcal: integer("kcal"),
    proteinG: integer("protein_g"),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    priceKobo: integer("price_kobo").notNull(),
    compareAtKobo: integer("compare_at_kobo"),
    badge: text("badge"),
    goal: text("goal"),
    slot: text("slot"), // breakfast | lunch | dinner | drink (meals)
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    categoryId: integer("category_id").references(() => categories.id),
    mealsPerDay: integer("meals_per_day"),
    daysPerWeek: integer("days_per_week"),
    weeklySlots: integer("weekly_slots"), // null = unlimited
    slotsTaken: integer("slots_taken").notNull().default(0),
    isLive: boolean("is_live").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("products_type_idx").on(t.type, t.isLive)],
);

export const planCalorieOptions = pgTable(
  "plan_calorie_options",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    kcal: integer("kcal").notNull(),
    priceKobo: integer("price_kobo").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.kcal] })],
);

export const weeklyMenus = pgTable("weekly_menus", {
  id: serial("id").primaryKey(),
  weekOf: date("week_of").notNull().unique(),
});

export const weeklyMenuItems = pgTable(
  "weekly_menu_items",
  {
    id: serial("id").primaryKey(),
    menuId: integer("menu_id").notNull().references(() => weeklyMenus.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // Mon..Fri
    slot: text("slot").notNull(), // breakfast | lunch | dinner
    mealId: uuid("meal_id").notNull().references(() => products.id),
  },
  (t) => [uniqueIndex("weekly_menu_items_slot").on(t.menuId, t.day, t.slot)],
);

/* ---------- Cart (signed-in) ---------- */

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  qty: integer("qty").notNull().default(1),
  options: jsonb("options").$type<Record<string, unknown>>().notNull().default({}),
});

/* ---------- Delivery, promos, settings ---------- */

export const deliveryZones = pgTable("delivery_zones", {
  id: text("id").primaryKey(), // mainland | island | lekki-ajah | pickup
  name: text("name").notNull(),
  areas: text("areas").notNull(),
  feeKobo: integer("fee_kobo").notNull(),
  sort: integer("sort").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const promoCodes = pgTable("promo_codes", {
  code: text("code").primaryKey(),
  type: text("type").notNull(), // percent | fixed
  value: integer("value").notNull(),
  appliesTo: text("applies_to").notNull().default("first_week_plan"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  theme: text("theme").notNull().default("editorial-green"),
  setup: jsonb("setup").$type<Record<string, boolean>>().notNull().default({}),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------- Orders and payments ---------- */

export const paymentMethod = pgEnum("payment_method", ["card", "transfer", "pod"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "awaiting_confirmation",
  "paid",
  "failed",
]);
export const orderStatus = pgEnum("order_status", [
  "pending_payment",
  "cooking",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(), // CL-10482
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    zoneId: text("zone_id").notNull().references(() => deliveryZones.id),
    address: text("address").notNull(),
    deliveryDate: date("delivery_date").notNull(),
    deliveryWindow: text("delivery_window").notNull(),
    notes: text("notes"),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    discountKobo: integer("discount_kobo").notNull().default(0),
    deliveryKobo: integer("delivery_kobo").notNull().default(0),
    podFeeKobo: integer("pod_fee_kobo").notNull().default(0),
    totalKobo: integer("total_kobo").notNull(),
    paymentMethod: paymentMethod("payment_method"),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    status: orderStatus("status").notNull().default("pending_payment"),
    promoCode: text("promo_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_email_idx").on(t.email)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  qty: integer("qty").notNull(),
  unitPriceKobo: integer("unit_price_kobo").notNull(),
  options: jsonb("options").$type<Record<string, unknown>>().notNull().default({}),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: paymentMethod("method").notNull(),
  amountKobo: integer("amount_kobo").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  providerRef: text("provider_ref").unique(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------- Reviews ---------- */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    fullness: integer("fullness"),
    pepper: integer("pepper"),
    weightChange: text("weight_change"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    verified: boolean("verified").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

/* ---------- Relations ---------- */

export const productsRelations = relations(products, ({ many }) => ({
  calorieOptions: many(planCalorieOptions),
  reviews: many(reviews),
}));
export const planCalorieOptionsRelations = relations(planCalorieOptions, ({ one }) => ({
  product: one(products, { fields: [planCalorieOptions.productId], references: [products.id] }),
}));
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payments: many(payments),
  zone: one(deliveryZones, { fields: [orders.zoneId], references: [deliveryZones.id] }),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));
export const weeklyMenuItemsRelations = relations(weeklyMenuItems, ({ one }) => ({
  menu: one(weeklyMenus, { fields: [weeklyMenuItems.menuId], references: [weeklyMenus.id] }),
  meal: one(products, { fields: [weeklyMenuItems.mealId], references: [products.id] }),
}));
export const weeklyMenusRelations = relations(weeklyMenus, ({ many }) => ({
  items: many(weeklyMenuItems),
}));

/* ---------- Subscriptions: paused weeks ---------- */

export const pausedWeeks = pgTable(
  "paused_weeks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    weekOf: date("week_of").notNull(), // Monday of the paused week
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("paused_weeks_user_week").on(t.userId, t.weekOf)],
);

/* ---------- Passwordless email sign-in codes ---------- */

export const loginCodes = pgTable(
  "login_codes",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("login_codes_email_idx").on(t.email, t.createdAt)],
);
