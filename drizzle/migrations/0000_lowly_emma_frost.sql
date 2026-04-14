CREATE TABLE "meals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"servings" integer DEFAULT 2 NOT NULL,
	"prep_time_min" integer,
	"cook_time_min" integer,
	"ingredients" text DEFAULT '[]' NOT NULL,
	"instructions" text DEFAULT '[]' NOT NULL,
	"image_url" text,
	"meal_type" text DEFAULT 'lunch' NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"salt" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_meals" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"meal_id" text,
	"user_recipe_id" text,
	"day_of_week" integer NOT NULL,
	"meal_type" text DEFAULT 'lunch' NOT NULL,
	"rerolled_at" bigint
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"num_people" integer DEFAULT 2 NOT NULL,
	"onboarding_completed" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"servings" integer DEFAULT 2 NOT NULL,
	"prep_time_min" integer,
	"cook_time_min" integer,
	"ingredients" text DEFAULT '[]' NOT NULL,
	"instructions" text DEFAULT '[]' NOT NULL,
	"meal_type" text DEFAULT 'lunch' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start" text NOT NULL,
	"generated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_plan_id_weekly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_user_recipe_id_user_recipes_id_fk" FOREIGN KEY ("user_recipe_id") REFERENCES "public"."user_recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recipes" ADD CONSTRAINT "user_recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_plan_day_type" ON "planned_meals" USING btree ("plan_id","day_of_week","meal_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_week" ON "weekly_plans" USING btree ("user_id","week_start");