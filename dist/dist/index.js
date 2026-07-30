var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  heroImages: () => heroImages,
  inquiries: () => inquiries,
  insertHeroImageSchema: () => insertHeroImageSchema,
  insertInquirySchema: () => insertInquirySchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPropertyRequestSchema: () => insertPropertyRequestSchema,
  insertPropertySchema: () => insertPropertySchema,
  insertPropertyTypeSchema: () => insertPropertyTypeSchema,
  insertSiteSettingsSchema: () => insertSiteSettingsSchema,
  insertSubscriberSchema: () => insertSubscriberSchema,
  insertUserSchema: () => insertUserSchema,
  passwordResetTokens: () => passwordResetTokens,
  properties: () => properties,
  propertyRequests: () => propertyRequests,
  propertyTypes: () => propertyTypes,
  siteSettings: () => siteSettings,
  subscribers: () => subscribers,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, insertUserSchema, properties, insertPropertySchema, inquiries, insertInquirySchema, propertyRequests, insertPropertyRequestSchema, subscribers, passwordResetTokens, insertSubscriberSchema, insertPasswordResetTokenSchema, heroImages, insertHeroImageSchema, siteSettings, insertSiteSettingsSchema, propertyTypes, insertPropertyTypeSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      email: text("email").notNull(),
      isAdmin: boolean("is_admin").default(false).notNull()
    });
    insertUserSchema = createInsertSchema(users).pick({
      username: true,
      password: true,
      email: true,
      isAdmin: true
    });
    properties = pgTable("properties", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      price: integer("price").notNull(),
      address: text("address").notNull(),
      city: text("city").notNull(),
      subcity: text("subcity"),
      state: text("state").notNull(),
      zipCode: text("zip_code").notNull(),
      country: text("country").notNull(),
      bedrooms: integer("bedrooms").notNull(),
      bathrooms: integer("bathrooms").notNull(),
      squareFeet: integer("square_feet").notNull(),
      propertyType: text("property_type").notNull(),
      yearBuilt: integer("year_built"),
      videoUrl: text("video_url"),
      features: jsonb("features").$type(),
      images: jsonb("images").$type(),
      status: text("status").notNull().default("For Sale"),
      latitude: text("latitude"),
      longitude: text("longitude"),
      isFeatured: boolean("is_featured").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertPropertySchema = createInsertSchema(properties).omit({
      id: true,
      createdAt: true
    });
    inquiries = pgTable("inquiries", {
      id: serial("id").primaryKey(),
      propertyId: integer("property_id"),
      name: text("name").notNull(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      message: text("message").notNull(),
      status: text("status").notNull().default("New"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertInquirySchema = createInsertSchema(inquiries).omit({
      id: true,
      createdAt: true
    });
    propertyRequests = pgTable("property_requests", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      email: text("email").notNull(),
      phone: text("phone").notNull(),
      requirements: text("requirements").notNull(),
      budget: integer("budget"),
      status: text("status").notNull().default("New"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertPropertyRequestSchema = createInsertSchema(propertyRequests).omit({
      id: true,
      createdAt: true
    });
    subscribers = pgTable("subscribers", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      email: text("email").notNull().unique(),
      phone: text("phone").notNull(),
      propertyInterests: text("property_interests"),
      // Store property interests as comma-separated text
      budget: text("budget"),
      createdAt: timestamp("created_at").defaultNow()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull(),
      attempts: integer("attempts").default(0).notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSubscriberSchema = createInsertSchema(subscribers).omit({
      id: true,
      createdAt: true
    });
    insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
      id: true,
      createdAt: true
    });
    heroImages = pgTable("hero_images", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description"),
      imageUrl: text("image_url").notNull(),
      active: boolean("active").default(true).notNull(),
      displayOrder: integer("display_order").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertHeroImageSchema = createInsertSchema(heroImages).omit({
      id: true,
      createdAt: true
    });
    siteSettings = pgTable("site_settings", {
      id: serial("id").primaryKey(),
      primaryPhone: text("primary_phone").default("0952000777"),
      secondaryPhone: text("secondary_phone"),
      tertiaryPhone: text("tertiary_phone"),
      quaternaryPhone: text("quaternary_phone"),
      whatsappPhone: text("whatsapp_phone"),
      telegramUsername: text("telegram_username"),
      telegramUrl: text("telegram_url"),
      instagramUrl: text("instagram_url"),
      facebookUrl: text("facebook_url"),
      email: text("email"),
      address: text("address"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
      id: true,
      updatedAt: true
    });
    propertyTypes = pgTable("property_types", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique()
    });
    insertPropertyTypeSchema = createInsertSchema(propertyTypes).omit({
      id: true
    });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var queryClient, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    queryClient = postgres(process.env.DATABASE_URL);
    db = drizzle(queryClient, { schema: schema_exports });
  }
});

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import pg from "pg";
import { eq, and, like, gte, lte, desc, asc, or, sql } from "drizzle-orm";
var Pool, MemoryStore, PostgresSessionStore, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    ({ Pool } = pg);
    MemoryStore = createMemoryStore(session);
    PostgresSessionStore = connectPg(session);
    DatabaseStorage = class {
      sessionStore;
      constructor() {
        if (process.env.NODE_ENV === "development") {
          this.sessionStore = new MemoryStore({
            checkPeriod: 864e5
          });
        } else {
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
              rejectUnauthorized: false
            }
          });
          this.sessionStore = new PostgresSessionStore({
            pool,
            createTableIfMissing: true
          });
        }
      }
      // User methods
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
      async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      }
      async updateUser(id, updates) {
        const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      async getAllUsers() {
        return db.select().from(users).orderBy(asc(users.username));
      }
      async updateUserRole(id, isAdmin2) {
        const [updatedUser] = await db.update(users).set({ isAdmin: isAdmin2 }).where(eq(users.id, id)).returning();
        return updatedUser;
      }
      async deleteUser(id) {
        try {
          await db.delete(users).where(eq(users.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting user:", error);
          return false;
        }
      }
      // Password reset token methods
      async createPasswordResetToken(userId, token, expiryMinutes) {
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
        await this.deleteAllUserPasswordResetTokens(userId);
        const [resetToken] = await db.insert(passwordResetTokens).values({
          userId,
          token,
          expiresAt
        }).returning();
        return resetToken;
      }
      async getPasswordResetToken(token) {
        const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
        return resetToken;
      }
      async incrementResetAttempts(id) {
        await db.update(passwordResetTokens).set({ attempts: sql`${passwordResetTokens.attempts} + 1` }).where(eq(passwordResetTokens.id, id));
      }
      async validatePasswordResetToken(token) {
        const resetToken = await this.getPasswordResetToken(token);
        if (!resetToken || new Date(resetToken.expiresAt) < /* @__PURE__ */ new Date() || resetToken.attempts >= 5) {
          if (resetToken) {
            await this.incrementResetAttempts(resetToken.id);
          }
          return null;
        }
        const user = await this.getUser(resetToken.userId);
        if (!user) {
          return null;
        }
        return user;
      }
      async deletePasswordResetToken(id) {
        try {
          await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting password reset token:", error);
          return false;
        }
      }
      async deleteAllUserPasswordResetTokens(userId) {
        try {
          await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
          return true;
        } catch (error) {
          console.error("Error deleting all user password reset tokens:", error);
          return false;
        }
      }
      // Property methods
      async getProperties() {
        return db.select().from(properties).orderBy(desc(properties.createdAt));
      }
      async getPropertyById(id) {
        const [property] = await db.select().from(properties).where(eq(properties.id, id));
        return property;
      }
      async getPropertyByFilters(filters) {
        let conditions = [];
        console.log("Applying property filters:", filters);
        if (filters.search) {
          const searchPattern = `%${filters.search}%`;
          conditions.push(
            or(
              like(properties.title, searchPattern),
              like(properties.description, searchPattern),
              like(properties.address, searchPattern),
              like(properties.city, searchPattern)
            )
          );
        }
        if (filters.minPrice) {
          const minPrice = typeof filters.minPrice === "number" ? filters.minPrice : parseInt(filters.minPrice);
          console.log(`Adding min price filter: ${minPrice}`);
          conditions.push(gte(properties.price, minPrice));
        }
        if (filters.maxPrice) {
          const maxPrice = typeof filters.maxPrice === "number" ? filters.maxPrice : parseInt(filters.maxPrice);
          console.log(`Adding max price filter: ${maxPrice}`);
          conditions.push(lte(properties.price, maxPrice));
        }
        if (filters.propertyType) {
          console.log(`Adding property type filter: ${filters.propertyType}`);
          console.log(`Database property types: House, Apartment, Villa, Condo, Townhouse, Land, Commercial`);
          const propertyType = filters.propertyType;
          const validPropertyTypes = ["House", "Apartment", "Villa", "Condo", "Townhouse", "Land", "Commercial"];
          const matchedType = validPropertyTypes.find(
            (t) => t.toLowerCase() === propertyType.toLowerCase()
          );
          console.log(`Filter value: "${propertyType}", Matched to: "${matchedType || "none"}"`);
          if (matchedType) {
            conditions.push(eq(properties.propertyType, matchedType));
            console.log(`Applied SQL filter: properties.property_type = '${matchedType}'`);
          } else {
            conditions.push(eq(properties.propertyType, propertyType));
            console.log(`Applied SQL filter with original value: properties.property_type = '${propertyType}'`);
          }
        }
        if (filters.bedrooms) {
          const bedrooms = typeof filters.bedrooms === "number" ? filters.bedrooms : parseInt(filters.bedrooms);
          if (bedrooms === 5) {
            console.log(`Adding bedrooms filter: \u2265 ${bedrooms} (5 or more)`);
            conditions.push(gte(properties.bedrooms, bedrooms));
          } else {
            console.log(`Adding exact bedrooms filter: = ${bedrooms}`);
            conditions.push(eq(properties.bedrooms, bedrooms));
          }
        }
        if (filters.city) {
          console.log(`Adding city filter: ${filters.city}`);
          conditions.push(
            or(
              like(properties.city, `%${filters.city}%`),
              like(properties.address, `%${filters.city}%`)
            )
          );
        }
        if (filters.subcity) {
          console.log(`Adding subcity filter: ${filters.subcity}`);
          const validSubcities = [
            "Kolfe Keraniyo",
            "Bole",
            "Lideta",
            "Arada",
            "Yeka",
            "Nifas Silk Lafto",
            "Lemi Kura",
            "Gulele",
            "Addis Ketema",
            "Kirkos",
            "Akaki Kaliti"
          ];
          const subcity = filters.subcity;
          const matchedSubcity = validSubcities.find(
            (s) => s.toLowerCase() === subcity.toLowerCase()
          );
          console.log(`Filter subcity value: "${subcity}", Matched to: "${matchedSubcity || "none"}"`);
          if (matchedSubcity) {
            conditions.push(eq(properties.subcity, matchedSubcity));
            console.log(`Applied SQL filter: properties.subcity = '${matchedSubcity}'`);
          } else {
            conditions.push(eq(properties.subcity, subcity));
            console.log(`Applied SQL filter with original value: properties.subcity = '${subcity}'`);
          }
        }
        if (filters.status) {
          console.log(`Adding status filter: ${filters.status}`);
          if (filters.status === "For Sale") {
            conditions.push(
              and(
                or(
                  eq(properties.status, "Available"),
                  eq(properties.status, "For Sale")
                ),
                sql`lower(${properties.propertyType}) IN ('house','apartment','villa','condo','townhouse','land','commercial','apartement building','shop')`
              )
            );
          } else if (filters.status === "For Rent") {
            conditions.push(
              and(
                or(
                  eq(properties.status, "Available"),
                  eq(properties.status, "For Rent")
                ),
                sql`lower(${properties.propertyType}) IN ('house','apartment','villa','condo','townhouse','apartement building','shop')`
              )
            );
          }
        }
        if (filters.propertyId) {
          console.log(`Adding propertyId filter: ${filters.propertyId}`);
          const id = parseInt(filters.propertyId);
          if (!isNaN(id)) {
            conditions.push(eq(properties.id, id));
          }
        }
        console.log(`Applied ${conditions.length} filter conditions`);
        if (conditions.length > 0) {
          return db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
        }
        return db.select().from(properties).orderBy(desc(properties.createdAt));
      }
      async getFeaturedProperties() {
        return db.select().from(properties).where(eq(properties.isFeatured, true)).orderBy(desc(properties.createdAt));
      }
      async createProperty(property) {
        if (property.bedrooms == null || property.bedrooms === "") property.bedrooms = 0;
        if (property.bathrooms == null || property.bathrooms === "") property.bathrooms = 0;
        property.bedrooms = Number(property.bedrooms);
        property.bathrooms = Number(property.bathrooms);
        if (property.videoUrl != null && property.videoUrl === "") property.videoUrl = null;
        const [newProperty] = await db.insert(properties).values([property]).returning();
        return newProperty;
      }
      async updateProperty(id, property) {
        if (property.bedrooms == null || property.bedrooms === "") property.bedrooms = 0;
        if (property.bathrooms == null || property.bathrooms === "") property.bathrooms = 0;
        if (property.bedrooms != null) property.bedrooms = Number(property.bedrooms);
        if (property.bathrooms != null) property.bathrooms = Number(property.bathrooms);
        if (property.videoUrl != null && property.videoUrl === "") property.videoUrl = null;
        const propertyData = {};
        for (const [key, value] of Object.entries(property)) {
          propertyData[key] = value;
        }
        const [updatedProperty] = await db.update(properties).set(propertyData).where(eq(properties.id, id)).returning();
        return updatedProperty;
      }
      async deleteProperty(id) {
        try {
          await db.delete(properties).where(eq(properties.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting property:", error);
          return false;
        }
      }
      // Inquiry methods
      async getInquiries() {
        return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
      }
      async getInquiryById(id) {
        const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
        return inquiry;
      }
      async getInquiriesByPropertyId(propertyId) {
        return db.select().from(inquiries).where(eq(inquiries.propertyId, propertyId)).orderBy(desc(inquiries.createdAt));
      }
      async createInquiry(inquiry) {
        const [newInquiry] = await db.insert(inquiries).values([inquiry]).returning();
        return newInquiry;
      }
      async updateInquiryStatus(id, status) {
        const [updatedInquiry] = await db.update(inquiries).set({ status }).where(eq(inquiries.id, id)).returning();
        return updatedInquiry;
      }
      async deleteInquiry(id) {
        try {
          await db.delete(inquiries).where(eq(inquiries.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting inquiry:", error);
          return false;
        }
      }
      // Property request methods
      async getPropertyRequests() {
        return db.select().from(propertyRequests).orderBy(desc(propertyRequests.createdAt));
      }
      async getPropertyRequestById(id) {
        const [request] = await db.select().from(propertyRequests).where(eq(propertyRequests.id, id));
        return request;
      }
      async createPropertyRequest(request) {
        const [newRequest] = await db.insert(propertyRequests).values([request]).returning();
        return newRequest;
      }
      async updatePropertyRequestStatus(id, status) {
        const [updatedRequest] = await db.update(propertyRequests).set({ status }).where(eq(propertyRequests.id, id)).returning();
        return updatedRequest;
      }
      async deletePropertyRequest(id) {
        try {
          await db.delete(propertyRequests).where(eq(propertyRequests.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting property request:", error);
          return false;
        }
      }
      // Subscriber methods
      async getSubscribers() {
        return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
      }
      async getSubscriberByEmail(email) {
        const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
        return subscriber;
      }
      async createSubscriber(subscriber) {
        try {
          const insertData = {
            name: subscriber.name,
            email: subscriber.email,
            phone: subscriber.phone,
            budget: subscriber.budget || null,
            propertyInterests: subscriber.propertyInterests || ""
          };
          console.log("Final insert data:", insertData);
          const [newSubscriber] = await db.insert(subscribers).values([insertData]).returning();
          return newSubscriber;
        } catch (error) {
          console.error("Error in createSubscriber:", error);
          throw error;
        }
      }
      async updateSubscriber(id, subscriber) {
        try {
          const updateData = {};
          if (subscriber.name) updateData.name = subscriber.name;
          if (subscriber.email) updateData.email = subscriber.email;
          if (subscriber.phone) updateData.phone = subscriber.phone;
          if (subscriber.budget !== void 0) updateData.budget = subscriber.budget;
          if (subscriber.propertyInterests !== void 0) {
            updateData.propertyInterests = subscriber.propertyInterests || "";
          }
          console.log("Update data:", updateData);
          const [updatedSubscriber] = await db.update(subscribers).set(updateData).where(eq(subscribers.id, id)).returning();
          return updatedSubscriber;
        } catch (error) {
          console.error("Error in updateSubscriber:", error);
          throw error;
        }
      }
      async deleteSubscriber(id) {
        try {
          await db.delete(subscribers).where(eq(subscribers.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting subscriber:", error);
          return false;
        }
      }
      // Hero Image methods
      async getHeroImages() {
        return db.select().from(heroImages).orderBy(asc(heroImages.displayOrder));
      }
      async getActiveHeroImages() {
        return db.select().from(heroImages).where(eq(heroImages.active, true)).orderBy(asc(heroImages.displayOrder));
      }
      async getHeroImageById(id) {
        const [heroImage] = await db.select().from(heroImages).where(eq(heroImages.id, id));
        return heroImage;
      }
      async createHeroImage(heroImage) {
        const [newHeroImage] = await db.insert(heroImages).values(heroImage).returning();
        return newHeroImage;
      }
      async updateHeroImage(id, heroImage) {
        const [updatedHeroImage] = await db.update(heroImages).set(heroImage).where(eq(heroImages.id, id)).returning();
        return updatedHeroImage;
      }
      async deleteHeroImage(id) {
        try {
          await db.delete(heroImages).where(eq(heroImages.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting hero image:", error);
          return false;
        }
      }
      // Site Settings methods
      async getSiteSettings() {
        const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
        return settings;
      }
      async updateSiteSettings(settings) {
        const existing = await this.getSiteSettings();
        if (!existing) {
          await db.insert(siteSettings).values({ id: 1, ...settings }).onConflictDoNothing();
          return this.getSiteSettings();
        }
        console.log("DEBUG: updateSiteSettings called with keys:", Object.keys(settings));
        console.log("DEBUG: updateSiteSettings payload sample:", settings);
        const [updatedSettings] = await db.update(siteSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(siteSettings.id, 1)).returning();
        return updatedSettings;
      }
      // Property Types methods
      async getPropertyTypes() {
        return db.select().from(propertyTypes).orderBy(asc(propertyTypes.name));
      }
      async getPropertyTypeById(id) {
        const [propertyType] = await db.select().from(propertyTypes).where(eq(propertyTypes.id, id));
        return propertyType;
      }
      async createPropertyType(propertyType) {
        const [newPropertyType] = await db.insert(propertyTypes).values(propertyType).returning();
        return newPropertyType;
      }
      async updatePropertyType(id, propertyType) {
        const [updatedPropertyType] = await db.update(propertyTypes).set(propertyType).where(eq(propertyTypes.id, id)).returning();
        return updatedPropertyType;
      }
      async deletePropertyType(id) {
        try {
          await db.delete(propertyTypes).where(eq(propertyTypes.id, id));
          return true;
        } catch (error) {
          console.error("Error deleting property type:", error);
          return false;
        }
      }
      async seedInitialData() {
        try {
          const adminUser = await this.getUserByUsername("admin");
          if (!adminUser) {
            const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
            const hashedPassword = await hashPassword2("admin123");
            await this.createUser({
              username: "admin",
              password: hashedPassword,
              email: "admin@ethioproperty.com",
              isAdmin: true
            });
          }
          const existingProperties = await this.getProperties();
          if (existingProperties.length === 0) {
            await db.insert(properties).values([{
              title: "Modern Family Home",
              description: "This beautiful modern family home offers a perfect blend of comfort and style. The open-concept floor plan provides a seamless flow between the living areas, making it ideal for both entertaining and everyday family life. Featuring 4 spacious bedrooms, 3 luxurious bathrooms, and a state-of-the-art kitchen with high-end appliances.",
              price: 785e3,
              address: "123 Willow Street",
              city: "Addis Ababa",
              state: "Addis Ababa",
              zipCode: "1000",
              country: "Ethiopia",
              bedrooms: 4,
              bathrooms: 3,
              squareFeet: 2540,
              propertyType: "House",
              yearBuilt: 2018,
              features: JSON.stringify(["Central AC", "Hardwood Floors", "Fireplace", "Walk-in Closets", "Stainless Appliances"]),
              images: JSON.stringify([
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              ]),
              status: "For Sale",
              latitude: "9.0222",
              longitude: "38.7468",
              isFeatured: true
            }]).returning();
            await db.insert(properties).values([{
              title: "Luxury Villa",
              description: "Spectacular villa with breathtaking views from every room. This luxury property features 5 bedrooms, 4 bathrooms, and an expansive living area with floor-to-ceiling windows that showcase the stunning scenery.",
              price: 125e4,
              address: "456 Mountain View",
              city: "Bishoftu",
              state: "Oromia",
              zipCode: "1234",
              country: "Ethiopia",
              bedrooms: 5,
              bathrooms: 4,
              squareFeet: 3800,
              propertyType: "Villa",
              yearBuilt: 2015,
              features: JSON.stringify(["Mountain View", "Infinity Pool", "Home Theater", "Wine Cellar", "Gourmet Kitchen"]),
              images: JSON.stringify([
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              ]),
              status: "For Sale",
              latitude: "8.7567",
              longitude: "38.9787",
              isFeatured: false
            }]).returning();
            await db.insert(properties).values([{
              title: "Downtown Apartment",
              description: "Modern downtown apartment in the heart of the city, offering convenience and style. This 2-bedroom, 2-bathroom unit features an open floor plan, high ceilings, and large windows that fill the space with natural light.",
              price: 399e3,
              address: "789 Bole Road",
              city: "Addis Ababa",
              state: "Addis Ababa",
              zipCode: "1000",
              country: "Ethiopia",
              bedrooms: 2,
              bathrooms: 2,
              squareFeet: 1100,
              propertyType: "Apartment",
              yearBuilt: 2010,
              features: JSON.stringify(["City View", "Hardwood Floors", "Stainless Steel Appliances", "In-unit Laundry", "Fitness Center"]),
              images: JSON.stringify([
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              ]),
              status: "For Rent",
              latitude: "9.0222",
              longitude: "38.7468",
              isFeatured: true
            }]).returning();
          }
        } catch (error) {
          console.error("Error seeding initial data:", error);
          throw error;
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/services/brevoEmail.ts
var brevoEmail_exports = {};
__export(brevoEmail_exports, {
  sendEmail: () => sendEmail,
  sendInquiryReply: () => sendInquiryReply,
  sendPasswordResetCode: () => sendPasswordResetCode,
  sendPasswordResetEmail: () => sendPasswordResetEmail
});
async function postBrevo(path3, body) {
  if (!apiKey) throw new Error("Brevo API key is not configured");
  const res = await fetch(`https://api.brevo.com/v3${path3}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text2 = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${text2}`);
  }
  return res.json();
}
async function sendEmail({ to, subject, htmlContent }) {
  const sender = {
    name: process.env.BREVO_SENDER_NAME || "Ethioproperty",
    email: process.env.BREVO_SENDER_EMAIL || "no-reply@ethioproperty.com"
  };
  const payload = {
    sender,
    to,
    subject,
    htmlContent
  };
  if (process.env.BREVO_REPLY_TO_EMAIL) {
    payload.replyTo = { email: process.env.BREVO_REPLY_TO_EMAIL };
  }
  try {
    const result = await postBrevo("/smtp/email", payload);
    console.log("Brevo email sent successfully:", result);
    return true;
  } catch (err) {
    console.error("Error sending email via Brevo:", err);
    return false;
  }
}
async function sendPasswordResetCode(email, code, expiryMinutes) {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
  const link = `${baseUrl.replace(/\/$/, "")}/auth`;
  return sendEmail({
    to: [{ email }],
    subject: "Your Password Reset Verification Code",
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Use the verification code below to proceed:</p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${code}</span>
        </div>
        <p>This code will expire in <strong>${expiryMinutes} minutes</strong>.</p>
        <p>For security reasons, you have a maximum of 5 attempts to enter this code correctly.</p>
        <p>You can enter the code on the <a href="${link}">password reset page</a>.</p>
        <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">This is an automated message from Ethioproperty Real Estate Hub.</p>
      </div>
    `
  });
}
async function sendInquiryReply(customerEmail, customerName, replyMessage) {
  return sendEmail({
    to: [{ email: customerEmail, name: customerName }],
    subject: "Reply to your inquiry - Ethioproperty",
    htmlContent: `
      <div style="font-family: sans-serif; padding: 20px;">
        <p>Hello ${customerName},</p>
        <p>${replyMessage.replace(/\n/g, "<br>")}</p>
        <p>Best regards,<br>Ethioproperty Team</p>
      </div>
    `
  });
}
async function sendPasswordResetEmail(email, username, newPassword) {
  const subject = `Password Reset for Your Ethio Property Account`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Hello ${username},</p>
        <p>Your password has been reset as requested. Your new password is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
          <p style="font-size: 18px; font-weight: bold; color: #285854;">${newPassword}</p>
        </div>
        <p>Please login with this temporary password and change it immediately for security reasons.</p>
        <p>You can access your account at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
      </div>
    </div>
  `;
  try {
    return await sendEmail({
      to: [{ email }],
      subject,
      htmlContent
    });
  } catch (err) {
    console.error("Brevo password reset send error:", err);
    return false;
  }
}
var apiKey;
var init_brevoEmail = __esm({
  "server/services/brevoEmail.ts"() {
    "use strict";
    apiKey = process.env.BREVO_API_KEY || process.env.BREVO_API || process.env.BREVO || "";
  }
});

// server/gmail.ts
var gmail_exports = {};
__export(gmail_exports, {
  sendAdminWelcomeEmail: () => sendAdminWelcomeEmail,
  sendPasswordResetCodeEmail: () => sendPasswordResetCodeEmail,
  sendPasswordResetConfirmationEmail: () => sendPasswordResetConfirmationEmail
});
import nodemailer from "nodemailer";
async function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not configured: GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required");
  }
  const maskedUser = process.env.GMAIL_USER.substring(0, 3) + "***" + process.env.GMAIL_USER.substring(process.env.GMAIL_USER.indexOf("@"));
  const maskedPass = process.env.GMAIL_APP_PASSWORD.substring(0, 2) + "***" + process.env.GMAIL_APP_PASSWORD.substring(process.env.GMAIL_APP_PASSWORD.length - 2);
  console.log(`Email credentials: ${maskedUser} / ${maskedPass}`);
  try {
    console.log("Trying local SMTP server (127.0.0.1:3000)...");
    const localTransporter = nodemailer.createTransport({
      host: "127.0.0.1",
      port: 3e3,
      secure: false,
      // Using TLS instead of SSL
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        // Do not fail on invalid certificates (useful for local development)
        rejectUnauthorized: false
      }
    });
    await localTransporter.verify();
    console.log("Local SMTP connection verified successfully");
    return localTransporter;
  } catch (localError) {
    const errorMessage = localError instanceof Error ? localError.message : "Unknown error";
    console.log("Local SMTP server not accessible:", errorMessage);
    try {
      console.log("Falling back to Gmail SMTP server...");
      const gmailTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        // use SSL
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false
        },
        debug: true
        // Enable debug output
      });
      console.log("Verifying Gmail SMTP connection...");
      await gmailTransporter.verify();
      console.log("Gmail SMTP connection verified successfully");
      return gmailTransporter;
    } catch (gmailError) {
      const errorMessage2 = gmailError instanceof Error ? gmailError.message : "Unknown error";
      console.error("Gmail SMTP connection verification failed:", errorMessage2);
      throw gmailError instanceof Error ? gmailError : new Error("Gmail SMTP connection failed");
    }
  }
}
async function sendPasswordResetCodeEmail(user, resetCode, expiryMinutes) {
  try {
    console.log("\n--- BEGINNING PASSWORD RESET EMAIL SEQUENCE ---");
    console.log(`Attempting to send reset code "${resetCode}" to user ${user.username} at ${user.email}`);
    if (!transporter) {
      console.log("No existing transporter found, creating a new one...");
      transporter = await createTransporter();
      console.log("Transporter created successfully");
    } else {
      console.log("Using existing email transporter");
    }
    const { email, username } = user;
    console.log("Configuring email options...");
    const mailOptions = {
      from: `"Ethio Property" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Ethio Property Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Password Reset Verification</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password. Please use the verification code below to complete the password reset process:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
              <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #285854;">${resetCode}</p>
            </div>
            <p>This code will expire in ${expiryMinutes} minutes.</p>
            <p>If you did not request this password reset, please ignore this email or contact the system administrator.</p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
            </div>
          </div>
          <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
            <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
          </div>
        </div>
      `,
      // Add text alternative for email clients that don't support HTML
      text: `
ETHIO PROPERTY
==============

Password Reset Verification
---------------------------

Hello ${username},

We received a request to reset your password. Please use the verification code below to complete the password reset process:

${resetCode}

This code will expire in ${expiryMinutes} minutes.

If you did not request this password reset, please ignore this email or contact the system administrator.

This is an automated message from Ethio Property. Please do not reply to this email.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.
      `
    };
    console.log(`Now sending email to ${email}...`);
    if (!transporter) {
      throw new Error("Failed to initialize email transporter");
    }
    console.log("Email sending details:");
    console.log("- From:", mailOptions.from);
    console.log("- To:", mailOptions.to);
    console.log("- Subject:", mailOptions.subject);
    console.log("- Text Preview:", mailOptions.text.substring(0, 100) + "...");
    const info = await transporter.sendMail(mailOptions);
    console.log("=== EMAIL SEND RESULT ===");
    console.log("Password reset code email sent with response:", info.response);
    console.log("Message ID:", info.messageId);
    if (nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === "function") {
      console.log("Preview URL (if using ethereal/test email):", nodemailer.getTestMessageUrl(info));
    }
    console.log("--- PASSWORD RESET EMAIL SEQUENCE COMPLETED SUCCESSFULLY ---\n");
    return true;
  } catch (error) {
    console.error("\n!!! ERROR SENDING PASSWORD RESET EMAIL !!!", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      if (error.message.includes("Username and Password not accepted")) {
        console.error("AUTHENTICATION ERROR: Gmail username or app password is incorrect. Please check your GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
        console.error("Note: App passwords are 16-character codes (4 groups of 4 characters with spaces) generated in your Google Account settings.");
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("CONNECTION ERROR: Could not connect to either local SMTP server or Gmail. Check your network connection and SMTP settings.");
      } else if (error.message.includes("SSL")) {
        console.error("SSL ERROR: There was an issue with the secure connection. This might be related to your network configuration or firewall settings.");
      }
    }
    console.error("--- PASSWORD RESET EMAIL SEQUENCE FAILED ---\n");
    return false;
  }
}
async function sendPasswordResetConfirmationEmail(user) {
  try {
    if (!transporter) {
      transporter = await createTransporter();
    }
    const { email, username, newPassword } = user;
    let subject, htmlContent, textContent;
    if (newPassword) {
      subject = "Your Ethio Property Password Has Been Reset";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Password Reset</h2>
            <p>Hello ${username},</p>
            <p>Your password has been reset as requested. Your new password is:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: #285854;">${newPassword}</p>
            </div>
            <p>Please login with this temporary password and change it immediately for security reasons.</p>
            <p>You can access your account at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
            <p>If you did not request a password reset, please contact us immediately.</p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
            </div>
          </div>
          <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
            <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
            <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
          </div>
        </div>
      `;
      textContent = `
ETHIO PROPERTY
==============

PASSWORD RESET

Hello ${username},

Your password has been reset as requested. Your new password is:

${newPassword}

Please login with this temporary password and change it immediately for security reasons.

You can access your account at: https://ethioproperty.com/auth

If you did not request a password reset, please contact us immediately.

This is an automated message from Ethio Property. Please do not reply to this email.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.
Visit us at ethioproperty.com
      `;
    } else {
      subject = "Your Ethio Property Password Has Been Reset";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Password Reset Successful</h2>
            <p>Hello ${username},</p>
            <p>Your password has been successfully reset.</p>
            <p>You can now log in with your new password.</p>
            <p>You can access your account at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
            <p>If you did not perform this action, please contact the system administrator immediately.</p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
            </div>
          </div>
          <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
            <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
            <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
          </div>
        </div>
      `;
      textContent = `
ETHIO PROPERTY
==============

Password Reset Successful
-------------------------

Hello ${username},

Your password has been successfully reset.

You can now log in with your new password.

You can access your account at: https://ethioproperty.com/auth

If you did not perform this action, please contact the system administrator immediately.

This is an automated message from Ethio Property. Please do not reply to this email.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.
Visit us at ethioproperty.com
      `;
    }
    const mailOptions = {
      from: `"Ethio Property" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent
    };
    console.log(`Attempting to send password reset ${newPassword ? "with new password" : "confirmation"} to ${email}`);
    if (!transporter) {
      throw new Error("Failed to initialize email transporter");
    }
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent via Gmail:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.message.includes("Username and Password not accepted")) {
        console.error("AUTHENTICATION ERROR: Gmail username or app password is incorrect. Please check your GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("CONNECTION ERROR: Could not connect to either local SMTP server or Gmail. Check your network connection and SMTP settings.");
      }
    }
    return false;
  }
}
async function sendAdminWelcomeEmail(user) {
  try {
    if (!transporter) {
      transporter = await createTransporter();
    }
    const { email, username } = user;
    const mailOptions = {
      from: `"Ethio Property" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Ethio Property Admin Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">Welcome to the Admin Portal</h2>
            <p>Hello ${username},</p>
            <p>Welcome to the Ethio Property admin portal! Your account has been created successfully.</p>
            <p>With your admin account, you can:</p>
            <ul>
              <li>Manage property listings</li>
              <li>Handle customer inquiries</li>
              <li>View and manage property requests</li>
              <li>Manage subscribers</li>
            </ul>
            <p>You can access the admin portal by logging in at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a> with your username and password.</p>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
              <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
            </div>
          </div>
          <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
            <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
            <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
          </div>
        </div>
      `,
      text: `
ETHIO PROPERTY
==============

Welcome to the Admin Portal
---------------------------

Hello ${username},

Welcome to the Ethio Property admin portal! Your account has been created successfully.

With your admin account, you can:
* Manage property listings
* Handle customer inquiries
* View and manage property requests
* Manage subscribers

You can access the admin portal by logging in at https://ethioproperty.com/auth with your username and password.

This is an automated message from Ethio Property. Please do not reply to this email.

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.
Visit us at ethioproperty.com
      `
    };
    console.log(`Attempting to send admin welcome email to ${email}`);
    if (!transporter) {
      throw new Error("Failed to initialize email transporter");
    }
    const info = await transporter.sendMail(mailOptions);
    console.log("Admin welcome email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending admin welcome email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if (error.message.includes("Username and Password not accepted")) {
        console.error("AUTHENTICATION ERROR: Gmail username or app password is incorrect. Please check your GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error("CONNECTION ERROR: Could not connect to either local SMTP server or Gmail. Check your network connection and SMTP settings.");
      }
    }
    return false;
  }
}
var transporter;
var init_gmail = __esm({
  "server/gmail.ts"() {
    "use strict";
    transporter = null;
  }
});

// server/auth.ts
var auth_exports = {};
__export(auth_exports, {
  hashPassword: () => hashPassword,
  setupAuth: () => setupAuth
});
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    if (!stored.includes(".")) {
      console.error("Invalid password format: stored password doesn't contain a salt separator");
      return false;
    }
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password format: missing hash or salt part");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error(`Buffer length mismatch: hashed=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
      return false;
    }
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "estateease-secret-key",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  };
  console.log("\u{1F527} Session settings configured:", {
    secret: "***masked***",
    resave: sessionSettings.resave,
    saveUninitialized: sessionSettings.saveUninitialized,
    cookieOptions: sessionSettings.cookie
  });
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  (async () => {
    try {
      const admin = await storage.getUserByUsername("admin");
      const hashedPassword = await hashPassword("admin123");
      if (!admin) {
        await storage.createUser({
          username: "admin",
          password: hashedPassword,
          email: "admin@ethioproperties.com",
          isAdmin: true
        });
        console.log("\u2705 Default admin user created: admin / admin123");
      } else {
        await storage.updateUser(admin.id, { password: hashedPassword });
        if (!admin.isAdmin) {
          await storage.updateUserRole(admin.id, true);
        }
        console.log("\u2705 Admin credentials reset to: admin / admin123");
      }
    } catch (err) {
      console.error("Error creating/resetting default admin:", err);
    }
  })();
  app2.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", {
        username: req.body.username,
        email: req.body.email,
        hasPassword: !!req.body.password,
        isAdmin: req.body.isAdmin
      });
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Registration failed: Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }
      if (!req.body.username || !req.body.password || !req.body.email) {
        console.log("Registration failed: Missing required fields");
        return res.status(400).json({ message: "Missing required fields. Username, password and email are required." });
      }
      const user = await storage.createUser({
        username: req.body.username,
        email: req.body.email,
        password: await hashPassword(req.body.password),
        isAdmin: !!req.body.isAdmin
      });
      console.log("User created successfully:", { id: user.id, username: user.username });
      req.login(user, (err) => {
        if (err) {
          console.log("Login after registration failed:", err);
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        console.log("Registration complete and logged in");
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) {
        res.status(500).json({ message: err.message });
      } else {
        next(err);
      }
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { username, email } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.email !== email) {
        return res.status(200).json({
          message: "If a matching account was found, we've sent a password reset email."
        });
      }
      const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
      console.log(`password reset code for ${user.email}:`, resetCode);
      const expiryMinutes = 10;
      await storage.createPasswordResetToken(user.id, resetCode, expiryMinutes);
      const { sendPasswordResetCode: sendPasswordResetCode2 } = await Promise.resolve().then(() => (init_brevoEmail(), brevoEmail_exports));
      const emailSent = await sendPasswordResetCode2(user.email, resetCode, expiryMinutes);
      console.log(`Email sending attempt result: ${emailSent ? "Success" : "Failed"}`);
      const response = {
        message: "If a matching account was found, a verification code has been sent to your email. It will expire in 10 minutes."
      };
      if (!emailSent) {
        response.debugCode = resetCode;
      }
      res.json(response);
    } catch (err) {
      console.error("Error in forgot password:", err);
      res.status(200).json({
        message: "If a matching account was found, a verification code has been sent to your email."
      });
    }
  });
  app2.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Verification code and new password are required" });
      }
      const user = await storage.validatePasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      await storage.deleteAllUserPasswordResetTokens(user.id);
      console.log("==============================================================");
      console.log(`PASSWORD RESET SUCCESSFUL for ${user.username}`);
      console.log(`User can now log in with their new password`);
      console.log("==============================================================");
      try {
        const { sendPasswordResetConfirmationEmail: sendPasswordResetConfirmationEmail3 } = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
        const emailSent = await sendPasswordResetConfirmationEmail3({
          email: user.email,
          username: user.username
        });
        console.log(`Confirmation email sent: ${emailSent ? "Success" : "Failed"}`);
      } catch (emailErr) {
        console.error("Error sending confirmation email:", emailErr);
      }
      res.json({
        message: "Password has been reset successfully. You can now log in with your new password."
      });
    } catch (err) {
      console.error("Error in reset password:", err);
      if (err instanceof Error) {
        res.status(500).json({ message: "An error occurred while resetting your password. Please try again." });
      } else {
        next(err);
      }
    }
  });
}
var scryptAsync;
var init_auth = __esm({
  "server/auth.ts"() {
    "use strict";
    init_storage();
    scryptAsync = promisify(scrypt);
  }
});

// server/aws-ses.ts
var aws_ses_exports = {};
__export(aws_ses_exports, {
  sendInquiryEmail: () => sendInquiryEmail,
  sendPasswordResetCodeEmail: () => sendPasswordResetCodeEmail2,
  sendPasswordResetConfirmationEmail: () => sendPasswordResetConfirmationEmail2,
  sendPasswordResetEmail: () => sendPasswordResetEmail2,
  sendPropertyRequestEmail: () => sendPropertyRequestEmail,
  sendPropertyVisitRequestEmail: () => sendPropertyVisitRequestEmail,
  sendWelcomeEmail: () => sendWelcomeEmail
});
import {
  SESClient,
  SendEmailCommand
} from "@aws-sdk/client-ses";
async function sendSesEmail(to, subject, htmlBody, textBody) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("AWS credentials not found. Cannot send email via SES.");
    return false;
  }
  try {
    console.log(`Attempting to send email to ${to} via AWS SES...`);
    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8"
        },
        Body: {
          Text: {
            Data: textBody,
            Charset: "UTF-8"
          },
          Html: {
            Data: htmlBody,
            Charset: "UTF-8"
          }
        }
      }
    };
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    console.log(`Email sent successfully to ${to} via AWS SES`);
    return true;
  } catch (error) {
    console.error("Error sending email via AWS SES:", error);
    if (error instanceof Error) {
      console.error(`AWS SES Error details: ${error.message}`);
      console.error(`Error name: ${error.name}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return false;
  }
}
function sendInquiryEmail(inquiry, property) {
  const subject = `New Property Inquiry: ${property.title}`;
  const textBody = `
    NEW PROPERTY INQUIRY
    
    Property: ${property.title}
    From: ${inquiry.name} (${inquiry.email})
    Phone: ${inquiry.phone || "Not provided"}
    Message: ${inquiry.message}
  `;
  const htmlBody = `
    <h2>New Property Inquiry</h2>
    <p><strong>Property:</strong> ${property.title}</p>
    <p><strong>From:</strong> ${inquiry.name} (${inquiry.email})</p>
    <p><strong>Phone:</strong> ${inquiry.phone || "Not provided"}</p>
    <p><strong>Message:</strong> ${inquiry.message}</p>
  `;
  sendSesEmail(
    fromEmail,
    // Send to the admin email
    subject,
    htmlBody,
    textBody
  ).catch((err) => console.error("Failed to send inquiry email:", err));
  return true;
}
function sendPropertyRequestEmail(request) {
  const subject = `New Property Request`;
  const textBody = `
    NEW PROPERTY REQUEST
    
    From: ${request.name} (${request.email})
    Phone: ${request.phone || "Not provided"}
    Budget: $${request.budget || "Not specified"}
    Requirements: ${request.requirements}
  `;
  const htmlBody = `
    <h2>New Property Request</h2>
    <p><strong>From:</strong> ${request.name} (${request.email})</p>
    <p><strong>Phone:</strong> ${request.phone || "Not provided"}</p>
    <p><strong>Budget:</strong> $${request.budget || "Not specified"}</p>
    <p><strong>Requirements:</strong> ${request.requirements}</p>
  `;
  sendSesEmail(
    fromEmail,
    subject,
    htmlBody,
    textBody
  ).catch((err) => console.error("Failed to send property request email:", err));
  return true;
}
function sendPropertyVisitRequestEmail(request, property) {
  const subject = `Property Visit Request: ${property.title}`;
  const textBody = `
    PROPERTY VISIT REQUEST
    
    Property: ${property.title}
    From: ${request.name} (${request.email})
    Phone: ${request.phone || "Not provided"}
    Requested Date: ${request.visitDate || "Not specified"}
    Message: ${request.message}
  `;
  const htmlBody = `
    <h2>Property Visit Request</h2>
    <p><strong>Property:</strong> ${property.title}</p>
    <p><strong>From:</strong> ${request.name} (${request.email})</p>
    <p><strong>Phone:</strong> ${request.phone || "Not provided"}</p>
    <p><strong>Requested Date:</strong> ${request.visitDate || "Not specified"}</p>
    <p><strong>Message:</strong> ${request.message}</p>
  `;
  sendSesEmail(
    fromEmail,
    subject,
    htmlBody,
    textBody
  ).catch((err) => console.error("Failed to send visit request email:", err));
  return true;
}
async function sendPasswordResetEmail2(email, username, newPassword) {
  const subject = `Password Reset for Your Ethio Property Account`;
  const textBody = `
    PASSWORD RESET
    
    Hello ${username},
    
    Your password has been reset as requested. Your new password is:
    
    ${newPassword}
    
    Please login with this temporary password and change it immediately for security reasons.
    
    You can access your account at: https://ethioproperty.com/auth
    
    If you did not request a password reset, please contact us immediately.
    
    Thank you,
    Ethio Property Team
    
    Visit us at ethioproperty.com
  `;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Hello ${username},</p>
        <p>Your password has been reset as requested. Your new password is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
          <p style="font-size: 18px; font-weight: bold; color: #285854;">${newPassword}</p>
        </div>
        <p>Please login with this temporary password and change it immediately for security reasons.</p>
        <p>You can access your account at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
        <p>If you did not request a password reset, please contact us immediately.</p>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
        </div>
      </div>
      <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
        <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
      </div>
    </div>
  `;
  try {
    console.log(`Sending admin password reset email to ${email}`);
    const result = await sendSesEmail(
      email,
      subject,
      htmlBody,
      textBody
    );
    return result;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
async function sendPasswordResetCodeEmail2(user, resetCode, expiryMinutes) {
  const subject = `Your Ethio Property Password Reset Code`;
  const textBody = `
    PASSWORD RESET VERIFICATION CODE
    
    Hello ${user.username},
    
    We received a request to reset your password. Please use the verification code below to complete the password reset process:
    
    ${resetCode}
    
    This code will expire in ${expiryMinutes} minutes.
    
    You can complete your password reset at: https://ethioproperty.com/auth
    
    If you did not request this password reset, please ignore this email or contact the system administrator.
    
    Thank you,
    Ethio Property Team
    
    Visit us at ethioproperty.com
  `;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">Password Reset Verification</h2>
        <p>Hello ${user.username},</p>
        <p>We received a request to reset your password. Please use the verification code below to complete the password reset process:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #285854;">${resetCode}</p>
        </div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p>You can complete your password reset at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
        <p>If you did not request this password reset, please ignore this email or contact the system administrator.</p>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
        </div>
      </div>
      <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
        <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
      </div>
    </div>
  `;
  try {
    const result = await sendSesEmail(
      user.email,
      subject,
      htmlBody,
      textBody
    );
    return result;
  } catch (error) {
    console.error("Error sending password reset code email:", error);
    return false;
  }
}
async function sendPasswordResetConfirmationEmail2(user) {
  const subject = `Your Ethio Property Password Has Been Reset`;
  const textBody = `
    PASSWORD RESET SUCCESSFUL
    
    Hello ${user.username},
    
    Your password has been successfully reset.
    
    You can now log in with your new password.
    
    You can access your account at: https://ethioproperty.com/auth
    
    If you did not perform this action, please contact the system administrator immediately.
    
    Thank you,
    Ethio Property Team
    
    Visit us at ethioproperty.com
  `;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Hello ${user.username},</p>
        <p>Your password has been successfully reset.</p>
        <p>You can now log in with your new password.</p>
        <p>You can access your account at <a href="https://ethioproperty.com/auth" style="color: #285854; text-decoration: underline;">ethioproperty.com/auth</a></p>
        <p>If you did not perform this action, please contact the system administrator immediately.</p>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 12px;">This is an automated message from Ethio Property. Please do not reply to this email.</p>
        </div>
      </div>
      <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
        <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
      </div>
    </div>
  `;
  try {
    const result = await sendSesEmail(
      user.email,
      subject,
      htmlBody,
      textBody
    );
    return result;
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    return false;
  }
}
function sendWelcomeEmail(subscriber) {
  const subject = `Welcome to Ethio Property!`;
  const textBody = `
    WELCOME TO ETHIO PROPERTY
    
    Hello ${subscriber.name},
    
    Thank you for subscribing to Ethio Property! We're excited to help you find your dream property.
    
    As a subscriber, you'll receive:
    - New property listings matching your interests
    - Price updates on properties you're interested in
    - Special offers and promotions
    - Market insights and real estate guides
    
    Visit us anytime at: https://ethioproperty.com
    
    If you have any questions or need assistance, feel free to contact us.
    
    Thank you,
    Ethio Property Team
    
    Visit us at ethioproperty.com
  `;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <div style="background-color: #285854; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: #fff; margin: 0;">Ethio Property</h1>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #333;">Welcome to Ethio Property!</h2>
        <p>Hello ${subscriber.name},</p>
        <p>Thank you for subscribing to Ethio Property! We're excited to help you find your dream property.</p>
        <p>As a subscriber, you'll receive:</p>
        <ul>
          <li>New property listings matching your interests</li>
          <li>Price updates on properties you're interested in</li>
          <li>Special offers and promotions</li>
          <li>Market insights and real estate guides</li>
        </ul>
        <p>Visit us anytime at <a href="https://ethioproperty.com" style="color: #285854; text-decoration: underline;">ethioproperty.com</a></p>
        <p>If you have any questions or need assistance, feel free to contact us.</p>
        <p>Thank you,<br>Ethio Property Team</p>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
          <p style="color: #777; font-size: 12px;">You're receiving this email because you subscribed to updates from Ethio Property.</p>
        </div>
      </div>
      <div style="background-color: #90824B; padding: 15px; text-align: center; color: #fff; border-radius: 0 0 5px 5px;">
        <p style="margin: 0;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Ethio Property. All rights reserved.</p>
        <p style="margin: 5px 0 0; font-size: 12px;"><a href="https://ethioproperty.com" style="color: #fff; text-decoration: underline;">ethioproperty.com</a></p>
      </div>
    </div>
  `;
  sendSesEmail(
    subscriber.email,
    subject,
    htmlBody,
    textBody
  ).catch((err) => console.error("Failed to send welcome email:", err));
  return true;
}
var requiredEnvVars, missingEnvVars, formatRegion, region, sesClient, fromEmail;
var init_aws_ses = __esm({
  "server/aws-ses.ts"() {
    "use strict";
    requiredEnvVars = [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_REGION",
      "EMAIL_FROM"
    ];
    missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
    if (missingEnvVars.length > 0) {
      console.warn(`Warning: Missing environment variables for AWS SES: ${missingEnvVars.join(", ")}`);
      console.warn("Email functionality will be disabled. Messages will be logged to console only.");
    }
    formatRegion = (region2) => {
      if (!region2) return "us-east-1";
      const regionMap = {
        "us east 1": "us-east-1",
        "us east 2": "us-east-2",
        "us west 1": "us-west-1",
        "us west 2": "us-west-2",
        "eu west 1": "eu-west-1",
        "eu central 1": "eu-central-1",
        "ap northeast 1": "ap-northeast-1",
        "ap northeast 2": "ap-northeast-2",
        "ap southeast 1": "ap-southeast-1",
        "ap southeast 2": "ap-southeast-2",
        "ap south 1": "ap-south-1",
        "sa east 1": "sa-east-1",
        "europe": "eu-west-1",
        "us": "us-east-1",
        "asia": "ap-southeast-1",
        "europe stockholm": "eu-north-1",
        "eu north 1": "eu-north-1"
      };
      const normalizedRegion = region2.toLowerCase().replace(/[()]/g, "");
      if (regionMap[normalizedRegion]) {
        return regionMap[normalizedRegion];
      }
      return normalizedRegion.replace(/\s+/g, "-");
    };
    region = formatRegion(process.env.AWS_REGION);
    console.log(`Using AWS SES region: ${region}`);
    sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
      }
    });
    fromEmail = process.env.EMAIL_FROM || "ethioproperty1@gmail.com";
  }
});

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/email.ts
init_storage();
init_brevoEmail();
init_aws_ses();
function sendInquiryEmail2(inquiry, property) {
  const adminEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "ethioproperty1@gmail.com";
  const subject = `New Property Inquiry: ${property.title}`;
  const htmlContent = `
    <h2>New Property Inquiry</h2>
    <p><strong>Property:</strong> ${property.title}</p>
    <p><strong>From:</strong> ${inquiry.name} (${inquiry.email})</p>
    <p><strong>Phone:</strong> ${inquiry.phone || "Not provided"}</p>
    <p><strong>Message:</strong> ${inquiry.message}</p>
  `;
  return sendEmail({ to: [{ email: adminEmail }], subject, htmlContent });
}
function sendPropertyRequestEmail2(request) {
  const adminEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "ethioproperty1@gmail.com";
  const subject = `New Property Request`;
  const htmlContent = `
    <h2>New Property Request</h2>
    <p><strong>From:</strong> ${request.name} (${request.email})</p>
    <p><strong>Phone:</strong> ${request.phone || "Not provided"}</p>
    <p><strong>Budget:</strong> $${request.budget || "Not specified"}</p>
    <p><strong>Requirements:</strong> ${request.requirements}</p>
  `;
  return sendEmail({ to: [{ email: adminEmail }], subject, htmlContent });
}
function sendPropertyVisitRequestEmail2(request, property) {
  const adminEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "ethioproperty1@gmail.com";
  const subject = `Property Visit Request: ${property.title}`;
  const htmlContent = `
    <h2>Property Visit Request</h2>
    <p><strong>Property:</strong> ${property.title}</p>
    <p><strong>From:</strong> ${request.name} (${request.email})</p>
    <p><strong>Phone:</strong> ${request.phone || "Not provided"}</p>
    <p><strong>Requested Date:</strong> ${request.visitDate || "Not specified"}</p>
    <p><strong>Message:</strong> ${request.message}</p>
  `;
  return sendEmail({ to: [{ email: adminEmail }], subject, htmlContent });
}
async function handlePropertyInquiry(req, res) {
  try {
    const { propertyId } = req.params;
    const property = await storage.getPropertyById(parseInt(propertyId));
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const inquiry = await storage.createInquiry({
      ...req.body,
      propertyId: parseInt(propertyId),
      status: "New"
    });
    const emailSent = sendInquiryEmail2(inquiry, property);
    if (!emailSent) {
      return res.status(200).json({
        inquiry,
        message: "Inquiry saved but notification email failed to send"
      });
    }
    return res.status(201).json({ inquiry, message: "Inquiry sent successfully" });
  } catch (error) {
    console.error("Error handling property inquiry:", error);
    return res.status(500).json({ message: "Failed to process inquiry" });
  }
}
async function handlePropertyRequest(req, res) {
  try {
    const request = await storage.createPropertyRequest({
      ...req.body,
      status: "New"
    });
    const emailSent = sendPropertyRequestEmail2(request);
    if (!emailSent) {
      return res.status(200).json({
        request,
        message: "Request saved but notification email failed to send"
      });
    }
    return res.status(201).json({ request, message: "Property request sent successfully" });
  } catch (error) {
    console.error("Error handling property request:", error);
    return res.status(500).json({ message: "Failed to process property request" });
  }
}
async function handlePropertyVisitRequest(req, res) {
  try {
    const { propertyId } = req.params;
    const property = await storage.getPropertyById(parseInt(propertyId));
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const emailSent = sendPropertyVisitRequestEmail2(req.body, property);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send visit request" });
    }
    return res.status(200).json({ message: "Visit request sent successfully" });
  } catch (error) {
    console.error("Error handling property visit request:", error);
    return res.status(500).json({ message: "Failed to process visit request" });
  }
}

// server/routes.ts
init_schema();
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/routes/seo.ts
init_storage();
function escapeXml(text2) {
  if (!text2 || typeof text2 !== "string") {
    return "";
  }
  return text2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, "").trim();
}
function escapeUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }
  return url.replace(/&/g, "&amp;").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, "").trim();
}
function validateProperty(property) {
  return {
    ...property,
    title: property.title ? String(property.title).trim() : "Property",
    city: property.city ? String(property.city).trim() : "Addis Ababa",
    images: Array.isArray(property.images) ? property.images.filter((img) => img && typeof img === "string") : []
  };
}
var SITEMAP_CONFIG = {
  baseUrl: process.env.BASE_URL || "https://ethioproperty.com",
  // Paths to exclude from sitemap
  excludedPaths: ["/auth", "/admin", "/api"],
  // Page type configurations
  pageTypes: {
    homepage: { changefreq: "weekly", priority: 1 },
    properties: { changefreq: "daily", priority: 0.9 },
    categories: { changefreq: "weekly", priority: 0.8 },
    propertyDetail: { changefreq: "daily", priority: 0.8 },
    contact: { changefreq: "monthly", priority: 0.7 }
  }
};
function setupSEORoutes(app2) {
  console.log("Setting up SEO routes...");
  app2.get("/sitemap.xml/BingSiteAuth.xml", (req, res) => {
    const bingVerificationXml = `<?xml version="1.0"?>
<users>
        <user>7191BB52D5FE950E1C497EBACAE98606</user>
</users>`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(bingVerificationXml);
  });
  app2.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${SITEMAP_CONFIG.baseUrl}/sitemap.xml

# Block admin and auth areas
Disallow: /admin
Disallow: /auth
Disallow: /api

# Block file uploads directory if sensitive
Disallow: /uploads

# Allow property pages and images
Allow: /properties/*
Allow: /property/*
Allow: /*.jpg
Allow: /*.png
Allow: /*.webp

# Crawl delay (optional - 1 second between requests)
Crawl-delay: 1
`;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(robotsTxt);
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const properties2 = await storage.getProperties();
      const { baseUrl, pageTypes } = SITEMAP_CONFIG;
      const currentDate = (/* @__PURE__ */ new Date()).toISOString();
      const locationPages = generateLocationPages(properties2);
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${escapeUrl(baseUrl)}/</loc>
    <changefreq>${pageTypes.homepage.changefreq}</changefreq>
    <priority>${pageTypes.homepage.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
  
  <!-- Properties listing page -->
  <url>
    <loc>${escapeUrl(baseUrl)}/properties</loc>
    <changefreq>${pageTypes.properties.changefreq}</changefreq>
    <priority>${pageTypes.properties.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>
  
  <!-- Contact page -->
  <url>
    <loc>${escapeUrl(baseUrl)}/contact</loc>
    <changefreq>${pageTypes.contact.changefreq}</changefreq>
    <priority>${pageTypes.contact.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`;
      locationPages.forEach((location) => {
        sitemap += `
  <url>
    <loc>${escapeUrl(baseUrl + location.path)}</loc>
    <changefreq>${pageTypes.categories.changefreq}</changefreq>
    <priority>${pageTypes.categories.priority}</priority>
    <lastmod>${currentDate}</lastmod>
  </url>`;
      });
      properties2.forEach((property) => {
        const cleanProperty = validateProperty(property);
        const propertyUrl = `${baseUrl}/properties/${cleanProperty.id}`;
        const lastMod = cleanProperty.createdAt ? new Date(cleanProperty.createdAt).toISOString() : currentDate;
        sitemap += `
  <url>
    <loc>${escapeUrl(propertyUrl)}</loc>
    <changefreq>${pageTypes.propertyDetail.changefreq}</changefreq>
    <priority>${pageTypes.propertyDetail.priority}</priority>
    <lastmod>${lastMod}</lastmod>`;
        if (cleanProperty.images && cleanProperty.images.length > 0) {
          cleanProperty.images.forEach((imagePath) => {
            if (!imagePath || typeof imagePath !== "string") return;
            const imageUrl = imagePath.startsWith("http") ? imagePath : `${baseUrl}${imagePath}`;
            const imageCaption = escapeXml(`${cleanProperty.title} - ${cleanProperty.city}`);
            const imageTitle = escapeXml(cleanProperty.title);
            if (imageUrl && imageCaption && imageTitle) {
              sitemap += `
    <image:image>
      <image:loc>${escapeUrl(imageUrl)}</image:loc>
      <image:caption>${imageCaption}</image:caption>
      <image:title>${imageTitle}</image:title>
    </image:image>`;
            }
          });
        }
        sitemap += `
  </url>`;
      });
      sitemap += `
</urlset>`;
      const urlsetEndIndex = sitemap.lastIndexOf("</urlset>");
      if (urlsetEndIndex !== -1) {
        sitemap = sitemap.substring(0, urlsetEndIndex + "</urlset>".length);
      }
      if (sitemap.includes("<script") || sitemap.includes("<iframe")) {
        console.error("Dangerous content detected in sitemap");
        return res.status(500).send("Invalid XML sitemap generated");
      }
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  function generateLocationPages(properties2) {
    const locations = /* @__PURE__ */ new Set();
    const locationPages = [];
    properties2.forEach((property) => {
      if (property.city) {
        const citySlug = property.city.toLowerCase().replace(/\s+/g, "-");
        locations.add(`/properties/${citySlug}`);
      }
      if (property.subcity) {
        const subcitySlug = property.subcity.toLowerCase().replace(/\s+/g, "-");
        locations.add(`/properties/${subcitySlug}`);
      }
      if (property.propertyType) {
        const typeSlug = property.propertyType.toLowerCase().replace(/\s+/g, "-");
        locations.add(`/properties/type/${typeSlug}`);
      }
    });
    return Array.from(locations).map((path3) => ({
      path: path3,
      name: path3.split("/").pop()?.replace(/-/g, " ") || ""
    }));
  }
  app2.get("/sitemap-index.xml", async (req, res) => {
    try {
      const { baseUrl } = SITEMAP_CONFIG;
      const currentDate = (/* @__PURE__ */ new Date()).toISOString();
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;
      res.set("Content-Type", "application/xml");
      res.send(sitemapIndex);
    } catch (error) {
      console.error("Error generating sitemap index:", error);
      res.status(500).send("Error generating sitemap index");
    }
  });
  app2.get("/api/seo/structured-data", async (req, res) => {
    try {
      const properties2 = await storage.getFeaturedProperties();
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": "Ethio Property",
        "description": "Premier real estate agency in Ethiopia specializing in residential and commercial properties in Addis Ababa",
        "url": process.env.BASE_URL || "https://ethioproperty.com",
        "telephone": "+251 972 555 566",
        "email": "ethioproperty1@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Bole Road",
          "addressLocality": "Addis Ababa",
          "addressCountry": "ET"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "9.0084",
          "longitude": "38.7675"
        },
        "areaServed": [
          {
            "@type": "City",
            "name": "Addis Ababa"
          }
        ],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Property Listings",
          "itemListElement": properties2.slice(0, 10).map((property) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Accommodation",
              "name": property.title,
              "description": property.description,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": property.address,
                "addressLocality": property.subcity || property.city,
                "addressCountry": "ET"
              }
            },
            "price": property.price,
            "priceCurrency": "ETB"
          }))
        }
      };
      res.json(structuredData);
    } catch (error) {
      console.error("Error generating structured data:", error);
      res.status(500).json({ error: "Error generating structured data" });
    }
  });
  app2.get("/api/seo/validate-sitemap", async (req, res) => {
    try {
      const properties2 = await storage.getProperties();
      const { baseUrl } = SITEMAP_CONFIG;
      const currentDate = (/* @__PURE__ */ new Date()).toISOString();
      let testXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
      const testProperty = properties2.find((p) => p.title.includes("&") || p.title.includes("<") || p.title.includes(">"));
      if (testProperty) {
        const cleanProperty = validateProperty(testProperty);
        testXml += `
  <url>
    <loc>${escapeUrl(baseUrl)}/properties/${cleanProperty.id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${currentDate}</lastmod>`;
        if (cleanProperty.images && cleanProperty.images.length > 0) {
          const imagePath = cleanProperty.images[0];
          const imageUrl = imagePath.startsWith("http") ? imagePath : `${baseUrl}${imagePath}`;
          const imageCaption = escapeXml(`${cleanProperty.title} - ${cleanProperty.city}`);
          const imageTitle = escapeXml(cleanProperty.title);
          testXml += `
    <image:image>
      <image:loc>${escapeUrl(imageUrl)}</image:loc>
      <image:caption>${imageCaption}</image:caption>
      <image:title>${imageTitle}</image:title>
    </image:image>`;
        }
        testXml += `
  </url>`;
      }
      testXml += `
</urlset>`;
      res.json({
        originalTitle: testProperty?.title || "No problematic property found",
        escapedTitle: testProperty ? escapeXml(testProperty.title) : "N/A",
        xmlSample: testXml,
        validation: {
          hasXmlDeclaration: testXml.includes('<?xml version="1.0" encoding="UTF-8"?>'),
          hasUrlsetNamespace: testXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),
          hasImageNamespace: testXml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'),
          hasClosingTag: testXml.includes("</urlset>"),
          noUnescapedAmpersands: !testXml.match(/&(?!amp;|lt;|gt;|quot;|apos;)/g),
          noHtmlTags: !testXml.match(/<\/?(?:script|style|div|span|p|br|img|a|html|body|head)\b[^>]*>/gi)
        }
      });
    } catch (error) {
      console.error("Error validating sitemap:", error);
      res.status(500).json({ error: "Error validating sitemap" });
    }
  });
  app2.get("/api/seo/health", async (req, res) => {
    try {
      const properties2 = await storage.getProperties();
      const propertiesWithImages = properties2.filter((p) => p.images && p.images.length > 0);
      const seoHealth = {
        totalProperties: properties2.length,
        propertiesWithImages: propertiesWithImages.length,
        imagesCoverage: properties2.length > 0 ? Math.round(propertiesWithImages.length / properties2.length * 100) : 0,
        uniqueCities: new Set(properties2.map((p) => p.city).filter(Boolean)).size,
        uniqueSubcities: new Set(properties2.map((p) => p.subcity).filter(Boolean)).size,
        uniquePropertyTypes: new Set(properties2.map((p) => p.propertyType).filter(Boolean)).size,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(seoHealth);
    } catch (error) {
      console.error("Error generating SEO health check:", error);
      res.status(500).json({ error: "Error generating SEO health check" });
    }
  });
}

// server/utils/slug.ts
function generateSlug(title, subcity, city) {
  if (!title || title.trim() === "") {
    return "";
  }
  let combined = title.trim();
  if (subcity && subcity.trim() !== "") {
    combined += ` ${subcity.trim()}`;
  }
  const cityName = city && city.trim() !== "" ? city.trim() : "addis-ababa";
  if (!combined.toLowerCase().includes(cityName.toLowerCase())) {
    combined += ` ${cityName}`;
  }
  return combined.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}
function generatePropertyUrl(id, title, subcity, city) {
  const slug = generateSlug(title, subcity, city);
  if (!slug) {
    return `/properties/${id}`;
  }
  return `/properties/${id}-${slug}`;
}
function extractIdFromSlug(slug) {
  const match = slug.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// server/routes.ts
var uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storage_config = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, "image-" + uniqueSuffix + extension);
  }
});
var upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB
  },
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPEG, PNG, WEBP) are allowed"));
  }
});
function isAdmin(req, res, next) {
  console.log("\u{1F512} Checking admin authorization...");
  console.log("\u{1F36A} Cookies:", req.headers.cookie);
  console.log("\u{1F4CB} Headers:", JSON.stringify(req.headers, null, 2));
  if (!req.isAuthenticated()) {
    console.log("\u274C User is not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }
  console.log("\u2705 User is authenticated");
  console.log("\u{1F464} User details:", JSON.stringify({
    id: req.user?.id,
    username: req.user?.username,
    isAdmin: req.user?.isAdmin,
    email: req.user?.email
  }, null, 2));
  if (!req.user || !req.user.isAdmin) {
    console.log("\u274C User is not an admin");
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  console.log("\u2705 User has admin privileges");
  next();
}
async function registerRoutes(app2) {
  app2.use("/api", (req, res, next) => {
    const originalSend = res.send;
    const originalEnd = res.end;
    res.send = function(body) {
      res.setHeader("Content-Type", "application/json");
      return originalSend.call(this, body);
    };
    res.end = function(chunk) {
      if (chunk && typeof chunk === "string" && !res.get("Content-Type")) {
        try {
          JSON.parse(chunk);
          res.setHeader("Content-Type", "application/json");
        } catch (e) {
          console.error("API route attempted to return non-JSON data", chunk.substring(0, 100));
          res.setHeader("Content-Type", "application/json");
          return originalEnd.call(this, JSON.stringify({
            error: true,
            message: "Invalid response format",
            details: "The server returned non-JSON data"
          }), "utf8");
        }
      }
      return originalEnd.call(this, chunk, "utf8");
    };
    next();
  });
  setupAuth(app2);
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "up",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      authenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? {
        id: req.user.id,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        email: req.user.email ? "***@***" : null
        // Mask the email for privacy
      } : null
    });
  });
  app2.post("/api/debug/properties", async (req, res) => {req.body&&(req.body.video_url&&!req.body.videoUrl&&(req.body.videoUrl=req.body.video_url),req.body.videoURL&&!req.body.videoUrl&&(req.body.videoUrl=req.body.videoURL));
    console.log("DEBUG route: Property creation endpoint hit, bypassing admin check");
    console.log("DEBUG request body:", JSON.stringify(req.body, null, 2));
    console.log("DEBUG auth status:", req.isAuthenticated() ? "Authenticated" : "Not authenticated");
    console.log("DEBUG user:", req.user ? `${req.user.username} (${req.user.id})` : "No user");
    console.log("DEBUG Content-Type:", req.get("Content-Type"));
    try {
      if (!req.body.title) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (req.body.features && !Array.isArray(req.body.features)) {
        req.body.features = [];
      }
      if (req.body.images && !Array.isArray(req.body.images)) {
        req.body.images = [];
      }
      if (!req.body.country) {
        req.body.country = "Ethiopia";
      }
      if (!req.body.city) {
        req.body.city = "Addis Ababa";
      }
      if (!req.body.propertyType) {
        req.body.propertyType = "Apartment";
      }
      try {
        const validatedData = insertPropertySchema.parse(req.body);
        console.log("DEBUG data validation successful");
        const property = await storage.createProperty(validatedData);
        console.log("DEBUG property created successfully with ID:", property.id);
        res.status(201).json({
          success: true,
          message: "DEBUG: Property created successfully",
          property
        });
      } catch (validationError) {
        console.error("DEBUG validation error:", validationError);
        return res.status(400).json({
          success: false,
          message: "DEBUG: Validation failed",
          error: validationError instanceof Error ? validationError.message : "Unknown validation error"
        });
      }
    } catch (error) {
      console.error("DEBUG error creating property:", error);
      res.status(500).json({
        success: false,
        message: "DEBUG: Failed to create property",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.use("/uploads", (req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (!filePath.startsWith(uploadDir)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  }, (req, res, next) => {
    try {
      const extname = path.extname(req.path).toLowerCase();
      const validExts = [".jpg", ".jpeg", ".png", ".webp"];
      if (!validExts.includes(extname)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  }, (req, res, next) => {
    if (fs.existsSync(path.join(uploadDir, req.path))) {
      next();
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });
  app2.use("/uploads", (req, res) => {
    const filePath = path.join(uploadDir, req.path);
    res.sendFile(filePath);
  });
  app2.post("/api/upload-image", isAdmin, upload.single("image"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/site-settings", async (req, res) => {
    try {
      let settings = await storage.getSiteSettings();
      if (!settings) {
        settings = await storage.updateSiteSettings({ primaryPhone: "0952000777" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });
  app2.put("/api/admin/site-settings", isAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updateSiteSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });
  app2.put("/api/admin/site-settings", isAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updateSiteSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });
  app2.patch("/api/site-settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.updateSiteSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating site settings:", error);
      res.status(500).json({ message: "Failed to update site settings" });
    }
  });
  app2.patch("/api/admin/users/:id/password", isAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ message: "Password is required" });
      const hashedPassword = await hashPassword(password);
      const user = await storage.updateUser(parseInt(req.params.id), { password: hashedPassword });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  app2.get("/api/property-types", async (req, res) => {
    try {
      const types = await storage.getPropertyTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching property types:", error);
      res.status(500).json({ message: "Failed to fetch property types" });
    }
  });
  app2.post("/api/admin/property-types", isAdmin, async (req, res) => {
    try {
      const newType = await storage.createPropertyType(req.body);
      res.status(201).json(newType);
    } catch (error) {
      console.error("Error creating property type:", error);
      res.status(500).json({ message: "Failed to create property type" });
    }
  });
  app2.patch("/api/admin/property-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedType = await storage.updatePropertyType(id, req.body);
      if (!updatedType) return res.status(404).json({ message: "Property type not found" });
      res.json(updatedType);
    } catch (error) {
      console.error("Error updating property type:", error);
      res.status(500).json({ message: "Failed to update property type" });
    }
  });
  app2.delete("/api/admin/property-types/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePropertyType(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Property type not found" });
      }
    } catch (error) {
      console.error("Error deleting property type:", error);
      res.status(500).json({ message: "Failed to delete property type" });
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const filters = req.query;
      console.log("Property filter request:", filters);
      console.log("Raw query parameters:", req.query);
      const propertyFilters = {
        search: filters.search,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : void 0,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : void 0,
        propertyType: filters.propertyType,
        bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : void 0,
        city: filters.city,
        subcity: filters.subcity,
        status: filters.status,
        propertyId: filters.propertyId
      };
      console.log("Parsed filters:", propertyFilters);
      if (filters.propertyType) {
        console.log(`Received propertyType filter: "${filters.propertyType}"`);
        console.log(`Type of propertyType param: ${typeof filters.propertyType}`);
        console.log(`Raw property type: ${filters.propertyType}`);
        console.log(`Decoded property type: ${decodeURIComponent(filters.propertyType)}`);
        console.log(`Database property types: House, Apartment, Villa, Condo, Townhouse, Land, Commercial`);
        console.log(`WARNING: Property type filter is case-sensitive`);
      }
      console.log("Applying property filters:", propertyFilters);
      const properties2 = await storage.getPropertyByFilters(propertyFilters);
      console.log(`Found ${properties2.length} properties matching filters`);
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  app2.get("/api/properties/featured", async (req, res) => {
    try {
      const properties2 = await storage.getFeaturedProperties();
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.get("/api/properties/seo/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const propertyId = extractIdFromSlug(slug);
      if (!propertyId) {
        return res.status(400).json({
          message: "Invalid property URL format"
        });
      }
      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({
          message: "Property not found"
        });
      }
      const correctUrl = generatePropertyUrl(property.id, property.title, property.subcity, property.city);
      const requestedUrl = `/properties/seo/${slug}`;
      if (requestedUrl !== correctUrl) {
        return res.json({
          ...property,
          _meta: {
            canonicalUrl: correctUrl,
            requestedUrl,
            shouldRedirect: true
          }
        });
      }
      res.json({
        ...property,
        _meta: {
          canonicalUrl: correctUrl,
          slug: generateSlug(property.title, property.subcity, property.city)
        }
      });
    } catch (error) {
      console.error("Error fetching property by slug:", error);
      res.status(500).json({
        message: "Failed to fetch property"
      });
    }
  });
  app2.post("/api/admin/properties", isAdmin, async (req, res) => {req.body&&(req.body.video_url&&!req.body.videoUrl&&(req.body.videoUrl=req.body.video_url),req.body.videoURL&&!req.body.videoUrl&&(req.body.videoUrl=req.body.videoURL));
    console.log("\u{1F4E5} Property creation endpoint hit");
    console.log("\u{1F4DD} Request body:", JSON.stringify(req.body, null, 2));
    console.log("\u{1F512} Auth status:", req.isAuthenticated() ? "Authenticated" : "Not authenticated");
    console.log("\u{1F464} User:", req.user ? `${req.user.username} (${req.user.id})` : "No user");
    console.log("\u{1F9E9} Content-Type:", req.get("Content-Type"));
    try {
      if (!req.body.title) {
        console.error("\u274C Missing title in property creation request");
        return res.status(400).json({ message: "Title is required" });
      }
      if (req.body.features && !Array.isArray(req.body.features)) {
        console.error("\u274C Features must be an array, received:", typeof req.body.features);
        req.body.features = [];
      }
      if (req.body.images && !Array.isArray(req.body.images)) {
        console.error("\u274C Images must be an array, received:", typeof req.body.images);
        req.body.images = [];
      }
      if (!req.body.country) {
        console.log("\u2795 Adding default country: Ethiopia");
        req.body.country = "Ethiopia";
      }
      console.log("\u{1F6E0}\uFE0F Final data before validation:", JSON.stringify(req.body, null, 2));
      try {
        const validatedData = insertPropertySchema.parse(req.body);
        console.log("\u2705 Data validation successful");
        console.log("\u{1F4CB} Validated property data:", JSON.stringify(validatedData, null, 2));
        const property = await storage.createProperty(validatedData);
        console.log("\u{1F389} Property created successfully with ID:", property.id);
        res.status(201).json(property);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("\u26A0\uFE0F Validation error:", validationError.errors);
          return res.status(400).json({
            message: "Invalid property data",
            errors: validationError.errors
          });
        } else {
          throw validationError;
        }
      }
    } catch (error) {
      console.error("\u{1F4A5} Error creating property:", error);
      res.status(500).json({
        message: "Failed to create property",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.patch("/api/admin/properties/:id", isAdmin, async (req, res) => {req.body&&(req.body.video_url&&!req.body.videoUrl&&(req.body.videoUrl=req.body.video_url),req.body.videoURL&&!req.body.videoUrl&&(req.body.videoUrl=req.body.videoURL));
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const updatedProperty = await storage.updateProperty(id, req.body);
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/admin/properties/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const success = await storage.deleteProperty(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.post("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      req.body = validatedData;
      await handlePropertyInquiry(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  app2.post("/api/properties/:propertyId/visit", async (req, res) => {
    try {
      await handlePropertyVisitRequest(req, res);
    } catch (error) {
      console.error("Error processing visit request:", error);
      res.status(500).json({ message: "Failed to process visit request" });
    }
  });
  app2.post("/api/property-requests", async (req, res) => {
    try {
      const validatedData = insertPropertyRequestSchema.parse(req.body);
      req.body = validatedData;
      await handlePropertyRequest(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property request data", errors: error.errors });
      }
      console.error("Error creating property request:", error);
      res.status(500).json({ message: "Failed to create property request" });
    }
  });
  app2.get("/api/admin/inquiries", isAdmin, async (req, res) => {
    try {
      const inquiries2 = await storage.getInquiries();
      res.json(inquiries2);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });
  app2.post("/api/admin/inquiries/:id/reply", isAdmin, async (req, res) => {
    try {
      const { message } = req.body;
      const id = parseInt(req.params.id);
      const inquiry = await storage.getInquiryById(id);
      if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
      const { sendInquiryReply: sendInquiryReply2 } = await Promise.resolve().then(() => (init_brevoEmail(), brevoEmail_exports));
      const success = await sendInquiryReply2(inquiry.email, inquiry.name, message);
      if (success) {
        await storage.updateInquiryStatus(id, "Replied");
        res.json({ message: "Reply sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email via Brevo" });
      }
    } catch (error) {
      console.error("Error replying to inquiry:", error);
      res.status(500).json({ message: "Failed to process reply" });
    }
  });
  app2.patch("/api/admin/inquiries/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const updatedInquiry = await storage.updateInquiryStatus(id, status);
      if (!updatedInquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(updatedInquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });
  app2.delete("/api/admin/inquiries/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInquiry(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Inquiry not found" });
      }
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });
  app2.get("/api/admin/property-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getPropertyRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching property requests:", error);
      res.status(500).json({ message: "Failed to fetch property requests" });
    }
  });
  app2.delete("/api/admin/property-requests/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePropertyRequest(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Property request not found" });
      }
    } catch (error) {
      console.error("Error deleting property request:", error);
      res.status(500).json({ message: "Failed to delete property request" });
    }
  });
  app2.patch("/api/admin/property-requests/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const updatedRequest = await storage.updatePropertyRequestStatus(id, status);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Property request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating property request:", error);
      res.status(500).json({ message: "Failed to update property request" });
    }
  });
  app2.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { username, email, password, isAdmin: isAdmin2 } = req.body;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        isAdmin: !!isAdmin2
      });
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.post("/api/admin/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.email) {
        return res.status(400).json({ message: "User does not have an email address for password reset" });
      }
      console.log(`Processing password reset for user: ${user.username} (${user.email})`);
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
      const numbers = "23456789";
      const specialChars = "!@#$%^&*-_=+";
      const allChars = letters + numbers + specialChars;
      let newPassword = "";
      newPassword += letters.charAt(Math.floor(Math.random() * letters.length));
      newPassword += numbers.charAt(Math.floor(Math.random() * numbers.length));
      newPassword += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      for (let i = 0; i < 9; i++) {
        newPassword += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      newPassword = newPassword.split("").sort(() => 0.5 - Math.random()).join("");
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      console.log(`Password updated in database for user: ${user.username}`);
      let emailSent = false;
      let emailMethod = "None";
      let emailError = null;
      const hasBrevoConfig = process.env.BREVO_API_KEY || process.env.BREVO_API || process.env.BREVO;
      const hasAwsConfig = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION;
      const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
      try {
        if (hasBrevoConfig) {
          try {
            console.log(`Attempting to send password reset email via Brevo to ${user.email}`);
            const brevoSvc = await Promise.resolve().then(() => (init_brevoEmail(), brevoEmail_exports));
            emailSent = await brevoSvc.sendPasswordResetEmail(user.email, user.username, newPassword);
            if (emailSent) {
              console.log(`Successfully sent password reset email via Brevo to ${user.email}`);
              emailMethod = "Brevo";
            } else {
              console.error(`Failed to send password reset email via Brevo to ${user.email}`);
            }
          } catch (err) {
            console.error("Error while attempting Brevo send:", err);
          }
        }
        if (!emailSent && hasAwsConfig) {
          console.log(`Attempting to send password reset email via AWS SES to ${user.email}`);
          const awsSes = await Promise.resolve().then(() => (init_aws_ses(), aws_ses_exports));
          emailSent = await awsSes.sendPasswordResetEmail(user.email, user.username, newPassword);
          if (emailSent) {
            console.log(`Successfully sent password reset email via AWS SES to ${user.email}`);
            emailMethod = "AWS SES";
          } else {
            console.error(`Failed to send password reset email via AWS SES to ${user.email}`);
          }
        } else if (!emailSent) {
          console.log("AWS SES not configured, skipping AWS SES email attempt");
        }
        if (!emailSent && hasGmailConfig) {
          console.log(`Attempting to send password reset email via Gmail to ${user.email}`);
          const gmail = await Promise.resolve().then(() => (init_gmail(), gmail_exports));
          const gmailResult = await gmail.sendPasswordResetConfirmationEmail({
            email: user.email,
            username: user.username,
            newPassword
          });
          if (gmailResult) {
            emailSent = true;
            emailMethod = hasAwsConfig ? "Gmail (fallback)" : "Gmail";
            console.log(`Successfully sent password reset email via Gmail to ${user.email}`);
          } else {
            console.error(`Failed to send password reset email via Gmail to ${user.email}`);
          }
        } else if (!emailSent && !hasGmailConfig) {
          console.log("Gmail not configured, skipping Gmail email attempt");
        }
      } catch (error) {
        emailError = error;
        console.error("Error sending admin password reset email:", error);
        emailSent = false;
      }
      if (emailSent) {
        res.json({
          message: "Password reset successfully. A new password has been sent to the user's email.",
          method: emailMethod
        });
      } else {
        res.json({
          message: "Password reset successfully but failed to send email. Provide this temporary password to the user:",
          newPassword,
          emailError: emailError ? emailError.message : "Email sending configuration not available",
          emailMethod
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password. Please try again." });
    }
  });
  app2.patch("/api/admin/users/:id/role", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isAdmin: isUserAdmin } = req.body;
      if (isUserAdmin === void 0) {
        return res.status(400).json({ message: "isAdmin status is required" });
      }
      if (req.user && req.user.id === id && req.user.isAdmin && !isUserAdmin) {
        return res.status(400).json({ message: "You cannot remove your own admin privileges" });
      }
      const updatedUser = await storage.updateUserRole(id, !!isUserAdmin);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (req.user && req.user.id === id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      const success = await storage.deleteUser(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/subscribe", async (req, res) => {
    try {
      console.log("Subscription request received:", JSON.stringify(req.body));
      const subscriberData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        budget: req.body.budget || null
      };
      const validatedData = insertSubscriberSchema.omit({ propertyInterests: true }).parse(subscriberData);
      const propertyInterestsString = typeof req.body.propertyInterests === "string" ? req.body.propertyInterests : "";
      console.log("Processed property interests as string:", propertyInterestsString);
      const existingSubscriber = await storage.getSubscriberByEmail(validatedData.email);
      if (existingSubscriber) {
        return res.status(200).json({
          message: "We already have your contact information and property interests on file. Our specialists will be in touch soon.",
          subscriber: existingSubscriber
        });
      }
      const subscribeData = {
        ...validatedData,
        propertyInterests: propertyInterestsString
      };
      console.log("Final subscription data:", JSON.stringify(subscribeData));
      const subscriber = await storage.createSubscriber(subscribeData);
      res.status(201).json({
        message: "Thank you for your interest! Our property specialists will contact you about relevant listings soon.",
        subscriber
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      console.error("Error saving property interest data:", error);
      res.status(500).json({ message: "Failed to save your property interests. Please try again." });
    }
  });
  app2.get("/api/admin/subscribers", isAdmin, async (req, res) => {
    try {
      const subscribers2 = await storage.getSubscribers();
      res.json(subscribers2);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });
  app2.delete("/api/admin/subscribers/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSubscriber(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Subscriber not found" });
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });
  app2.get("/api/admin/export/inquiries", isAdmin, async (req, res) => {
    try {
      const inquiries2 = await storage.getInquiries();
      let csvContent = "Name,Email,Phone,Date,Property ID,Status\n";
      inquiries2.forEach((inquiry) => {
        const date = inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : "N/A";
        const escapedName = `"${inquiry.name.replace(/"/g, '""')}"`;
        const escapedEmail = `"${inquiry.email.replace(/"/g, '""')}"`;
        const escapedPhone = inquiry.phone ? `"${inquiry.phone.replace(/"/g, '""')}"` : '""';
        csvContent += `${escapedName},${escapedEmail},${escapedPhone},${date},${inquiry.propertyId},${inquiry.status}
`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=inquiries.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting inquiries:", error);
      res.status(500).json({ message: "Failed to export inquiries" });
    }
  });
  app2.get("/api/admin/export/property-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getPropertyRequests();
      let csvContent = "Name,Email,Phone,Requirements,Budget,Date,Status\n";
      requests.forEach((request) => {
        const date = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A";
        const escapedName = `"${request.name.replace(/"/g, '""')}"`;
        const escapedEmail = `"${request.email.replace(/"/g, '""')}"`;
        const escapedPhone = request.phone ? `"${request.phone.replace(/"/g, '""')}"` : '""';
        const escapedRequirements = request.requirements ? `"${request.requirements.replace(/"/g, '""')}"` : '""';
        csvContent += `${escapedName},${escapedEmail},${escapedPhone},${escapedRequirements},${request.budget || ""},${date},${request.status}
`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=property-requests.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting property requests:", error);
      res.status(500).json({ message: "Failed to export property requests" });
    }
  });
  app2.get("/api/admin/export/subscribers", isAdmin, async (req, res) => {
    try {
      const subscribers2 = await storage.getSubscribers();
      let csvContent = "Name,Email,Phone,Budget,Property Interests,Date\n";
      subscribers2.forEach((subscriber) => {
        const date = subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : "N/A";
        const escapedName = `"${subscriber.name.replace(/"/g, '""')}"`;
        const escapedEmail = `"${subscriber.email.replace(/"/g, '""')}"`;
        const escapedPhone = subscriber.phone ? `"${subscriber.phone.replace(/"/g, '""')}"` : '""';
        const escapedInterests = subscriber.propertyInterests ? `"${subscriber.propertyInterests.replace(/"/g, '""')}"` : '""';
        csvContent += `${escapedName},${escapedEmail},${escapedPhone},${subscriber.budget || ""},${escapedInterests},${date}
`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting subscribers:", error);
      res.status(500).json({ message: "Failed to export subscribers" });
    }
  });
  app2.get("/api/admin/hero-images", isAdmin, async (req, res) => {
    try {
      const heroImages2 = await storage.getHeroImages();
      res.json(heroImages2);
    } catch (error) {
      console.error("Error fetching hero images:", error);
      res.status(500).json({ message: "Failed to fetch hero images" });
    }
  });
  app2.get("/api/hero-images", async (req, res) => {
    try {
      const heroImages2 = await storage.getActiveHeroImages();
      res.json(heroImages2);
    } catch (error) {
      console.error("Error fetching active hero images:", error);
      res.status(500).json({ message: "Failed to fetch hero images" });
    }
  });
  app2.get("/api/admin/hero-images/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const heroImage = await storage.getHeroImageById(id);
      if (!heroImage) {
        return res.status(404).json({ message: "Hero image not found" });
      }
      res.json(heroImage);
    } catch (error) {
      console.error("Error fetching hero image:", error);
      res.status(500).json({ message: "Failed to fetch hero image" });
    }
  });
  app2.post("/api/admin/hero-images", isAdmin, async (req, res) => {
    try {
      const validatedData = insertHeroImageSchema.parse(req.body);
      const heroImage = await storage.createHeroImage(validatedData);
      res.status(201).json(heroImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hero image data", errors: error.errors });
      }
      console.error("Error creating hero image:", error);
      res.status(500).json({ message: "Failed to create hero image" });
    }
  });
  app2.patch("/api/admin/hero-images/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const heroImage = await storage.getHeroImageById(id);
      if (!heroImage) {
        return res.status(404).json({ message: "Hero image not found" });
      }
      const updatedHeroImage = await storage.updateHeroImage(id, req.body);
      res.json(updatedHeroImage);
    } catch (error) {
      console.error("Error updating hero image:", error);
      res.status(500).json({ message: "Failed to update hero image" });
    }
  });
  app2.delete("/api/admin/hero-images/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const heroImage = await storage.getHeroImageById(id);
      if (!heroImage) {
        return res.status(404).json({ message: "Hero image not found" });
      }
      const success = await storage.deleteHeroImage(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete hero image" });
      }
    } catch (error) {
      console.error("Error deleting hero image:", error);
      res.status(500).json({ message: "Failed to delete hero image" });
    }
  });
  const httpServer = createServer(app2);
  setupSEORoutes(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { nanoid } from "nanoid";
var viteLogger = { info: console.log, warn: console.warn, error: console.error };
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  if (app2.get("env") !== "development") return;
  let createViteServer;
  let viteLogger2;
  let vite;
  try {
    const viteModule = await import("vite");
    createViteServer = viteModule.createServer || viteModule.createServer;
    viteLogger2 = viteModule.createLogger && viteModule.createLogger() || viteModule.createLogger && viteModule.createLogger;
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true
    };
    const { default: viteConfig } = await import("../vite.config");
    vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger2,
        error: (msg, options) => {
          if (viteLogger2 && viteLogger2.error) viteLogger2.error(msg, options);
          process.exit(1);
        }
      },
      server: serverOptions,
      appType: "custom"
    });
  } catch (err) {
    console.warn("Vite dev server not available or failed to load; skipping dev middleware.", err && err.message ? err.message : err);
    return;
  }
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
dotenv.config();
init_auth();
init_storage();
console.log("DEBUG: process.cwd()=", process.cwd());
try {
  const dbHost = new URL(process.env.DATABASE_URL || "").host;
  console.log("DEBUG: Connected DB host=", dbHost || "(not set)");
} catch {
  console.log("DEBUG: DATABASE_URL is not a valid URL");
}
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    log("Initializing database with seed data...");
    await storage.seedInitialData();
    log("Database initialization complete");
  } catch (error) {
    log(`Error initializing database: ${error}`);
  }
  const server = await registerRoutes(app);
  try {
    const { setup: setupExtensions } = await import('../../extensions/features.js');
    await setupExtensions(app, server);
  } catch (extErr) {
    console.error('[extensions] Failed to load:', extErr.message);
  }
  app.use((err, _req, res, _next) => {
    console.error("Global error handler caught:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (!res.headersSent) {
      return res.status(status).json({
        error: true,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : void 0
      });
    }
    console.error("Error in request processing:", err);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT || 5e3);
  const listenOpts = { port, host: "0.0.0.0" };
  if (process.platform !== "win32") {
    listenOpts.reusePort = true;
  }
  server.listen(listenOpts, () => {
    log(`serving on port ${port}`);
  });
})();


// ====== UPDATED SITEMAP ROUTE (SEO FIX) ======
app.get('/sitemap.xml', async (req, res) => {
  try {
    const properties = await storage.getProperties();

    let urls = `
      <url>
        <loc>https://ethioproperty.com/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>

      <url>
        <loc>https://ethioproperty.com/properties</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `;

    properties.forEach((p) => {
      const slug = p.title
        ? p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : 'property';

      urls += `
        <url>
          <loc>https://ethioproperty.com/properties/${p.id}-${slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
        </url>
      `;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.status(200).send(sitemap);

  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Error generating sitemap");
  }
});
// ====== END SITEMAP ======
