CREATE TYPE "pmo"."permission_scope" AS ENUM('all', 'assigned');--> statement-breakpoint
CREATE TYPE "pmo"."project_role" AS ENUM('PM', 'PIC', 'Sponsor', 'Viewer');--> statement-breakpoint
CREATE TYPE "pmo"."user_status" AS ENUM('Active', 'Inactive', 'Locked');--> statement-breakpoint
CREATE TYPE "pmo"."lifecycle_status" AS ENUM('Draft', 'Active', 'On Hold', 'Closed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "pmo"."progress_status" AS ENUM('Not Started', 'In Progress', 'Completed');--> statement-breakpoint
CREATE TYPE "pmo"."rag_status" AS ENUM('Green', 'Amber', 'Red');--> statement-breakpoint
CREATE TABLE "pmo"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pmo"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pmo"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"label" text NOT NULL,
	"icon" text,
	"route" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"permission_code" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."project_members" (
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"project_role" "pmo"."project_role" NOT NULL,
	CONSTRAINT "project_members_project_id_user_id_project_role_pk" PRIMARY KEY("project_id","user_id","project_role")
);
--> statement-breakpoint
CREATE TABLE "pmo"."role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"scope" "pmo"."permission_scope" DEFAULT 'all' NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "pmo"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"username" text,
	"title" text,
	"unit" text,
	"phone" text,
	"status" "pmo"."user_status" DEFAULT 'Active' NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "pmo"."user_roles" (
	"user_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "pmo"."master_categories" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."master_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_code" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "master_values_category_code_value_unique" UNIQUE("category_code","value")
);
--> statement-breakpoint
CREATE TABLE "pmo"."settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"baseline_start" date NOT NULL,
	"baseline_finish" date NOT NULL,
	"reason" text,
	"change_request_id" uuid,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(9, 6) NOT NULL,
	"planned_start" date NOT NULL,
	"planned_finish" date NOT NULL,
	"actual_finish" date,
	"owner" text,
	"acceptance_criteria" text,
	"evidence_url" text,
	"notes" text,
	"seq" integer DEFAULT 0 NOT NULL,
	"calc_progress" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_status" "pmo"."progress_status" DEFAULT 'Not Started' NOT NULL,
	"calc_weighted_contribution" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_health" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "milestones_code_unique" UNIQUE("code"),
	CONSTRAINT "ms_dates" CHECK ("pmo"."milestones"."planned_finish" >= "pmo"."milestones"."planned_start"),
	CONSTRAINT "ms_weight" CHECK ("pmo"."milestones"."weight" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "pmo"."progress_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_item_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"from_status" "pmo"."progress_status",
	"to_status" "pmo"."progress_status" NOT NULL,
	"progress_after" numeric(9, 6) NOT NULL,
	"project_progress_after" numeric(9, 6),
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"pm_user_id" text,
	"sponsor" text,
	"portfolio" text,
	"customer" text,
	"contract_value" numeric(18, 2),
	"baseline_start" date NOT NULL,
	"baseline_finish" date NOT NULL,
	"forecast_finish" date,
	"actual_start" date,
	"actual_finish" date,
	"lifecycle_status" "pmo"."lifecycle_status" DEFAULT 'Draft' NOT NULL,
	"baseline_locked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"calc_overall_progress" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_planned_progress" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_variance" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_rag" "pmo"."rag_status",
	"calc_status" "pmo"."progress_status" DEFAULT 'Not Started' NOT NULL,
	"calc_milestone_count" integer DEFAULT 0 NOT NULL,
	"calc_overdue_milestones" integer DEFAULT 0 NOT NULL,
	"calc_open_high_raid" integer DEFAULT 0 NOT NULL,
	"last_calculated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_code_unique" UNIQUE("code"),
	CONSTRAINT "prj_dates" CHECK ("pmo"."projects"."baseline_finish" >= "pmo"."projects"."baseline_start")
);
--> statement-breakpoint
CREATE TABLE "pmo"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(9, 6) NOT NULL,
	"owner" text,
	"planned_start" date NOT NULL,
	"planned_finish" date NOT NULL,
	"actual_start" date,
	"actual_finish" date,
	"acceptance_criteria" text,
	"notes" text,
	"seq" integer DEFAULT 0 NOT NULL,
	"calc_progress" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_status" "pmo"."progress_status" DEFAULT 'Not Started' NOT NULL,
	"calc_weighted_contribution" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_eff_weight" numeric(9, 6) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tasks_code_unique" UNIQUE("code"),
	CONSTRAINT "task_dates" CHECK ("pmo"."tasks"."planned_finish" >= "pmo"."tasks"."planned_start"),
	CONSTRAINT "task_weight" CHECK ("pmo"."tasks"."weight" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "pmo"."work_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"code" text NOT NULL,
	"detail" text NOT NULL,
	"weight" numeric(9, 6) NOT NULL,
	"status" "pmo"."progress_status" DEFAULT 'Not Started' NOT NULL,
	"pic_user_id" text,
	"pic_name" text,
	"due_date" date,
	"evidence_url" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"updated_by" text,
	"calc_progress" numeric(9, 6) DEFAULT 0 NOT NULL,
	"calc_weighted_contribution" numeric(9, 6) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "work_items_code_unique" UNIQUE("code"),
	CONSTRAINT "wi_weight" CHECK ("pmo"."work_items"."weight" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "pmo"."budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"cost_category" text DEFAULT 'Project Cost' NOT NULL,
	"approved_budget" numeric(18, 2) DEFAULT 0 NOT NULL,
	"actual_cost" numeric(18, 2) DEFAULT 0 NOT NULL,
	"forecast_cost" numeric(18, 2) DEFAULT 0 NOT NULL,
	"variance" numeric(18, 2) GENERATED ALWAYS AS (approved_budget - forecast_cost) STORED,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_lines_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"request_date" date NOT NULL,
	"requested_by" text,
	"description" text NOT NULL,
	"impact_scope" text,
	"impact_schedule_days" integer DEFAULT 0,
	"impact_cost" numeric(18, 2) DEFAULT 0,
	"priority" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"decision" text DEFAULT 'Pending' NOT NULL,
	"approver_user_id" text,
	"approver_name" text,
	"decision_date" date,
	CONSTRAINT "change_requests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."delivery_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"gate_name" text NOT NULL,
	"planned_date" date NOT NULL,
	"actual_date" date,
	"status" text DEFAULT 'Planned' NOT NULL,
	"approval_by" text,
	"evidence_url" text,
	"notes" text,
	CONSTRAINT "delivery_gates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."raid_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"impact" text,
	"probability" text,
	"severity" text NOT NULL,
	"owner" text,
	"target_date" date,
	"status" text DEFAULT 'Open' NOT NULL,
	"mitigation" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raid_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."weekly_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text,
	"week_ending" date NOT NULL,
	"overall_progress" numeric(9, 6) NOT NULL,
	"planned_progress" numeric(9, 6),
	"variance" numeric(9, 6),
	"rag" "pmo"."rag_status",
	"completed_this_week" text,
	"next_week_plan" text,
	"key_issue" text,
	"is_closed" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_snapshots_code_unique" UNIQUE("code"),
	CONSTRAINT "snap_project_week" UNIQUE("project_id","week_ending")
);
--> statement-breakpoint
CREATE TABLE "pmo"."billing_term_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"billing_term_id" uuid NOT NULL,
	"milestone_id" uuid NOT NULL,
	"evidence_url" text,
	"evidence_type" text,
	"evidence_date" date,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"verification_status" text DEFAULT 'Not Checked' NOT NULL,
	"notes" text,
	CONSTRAINT "btm_term_ms" UNIQUE("billing_term_id","milestone_id")
);
--> statement-breakpoint
CREATE TABLE "pmo"."billing_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"code" text NOT NULL,
	"customer" text,
	"stage" text NOT NULL,
	"description" text,
	"amount" numeric(18, 2) NOT NULL,
	"planned_billing_date" date,
	"actual_invoice_date" date,
	"invoice_number" text,
	"invoice_evidence_url" text,
	"invoice_status" text DEFAULT 'Draft' NOT NULL,
	"payment_status" text DEFAULT 'Unpaid' NOT NULL,
	"calc_linked_count" integer DEFAULT 0 NOT NULL,
	"calc_completed_count" integer DEFAULT 0 NOT NULL,
	"calc_evidence_verified_count" integer DEFAULT 0 NOT NULL,
	"calc_readiness" text DEFAULT 'No Milestone Linked' NOT NULL,
	CONSTRAINT "billing_terms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pmo"."attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"mime" text,
	"size" integer,
	"storage_key" text NOT NULL,
	"uploaded_by" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmo"."audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "pmo"."import_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"project_code" text,
	"pm_name" text,
	"import_date" timestamp with time zone DEFAULT now() NOT NULL,
	"validation_status" text NOT NULL,
	"issue_notes" text,
	"rows_total" integer DEFAULT 0,
	"rows_ok" integer DEFAULT 0,
	"rows_failed" integer DEFAULT 0,
	"imported_by" text
);
--> statement-breakpoint
ALTER TABLE "pmo"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "pmo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "pmo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."project_members" ADD CONSTRAINT "project_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "pmo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "pmo"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "pmo"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "pmo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "pmo"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "pmo"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."master_values" ADD CONSTRAINT "master_values_category_code_master_categories_code_fk" FOREIGN KEY ("category_code") REFERENCES "pmo"."master_categories"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."baselines" ADD CONSTRAINT "baselines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."baselines" ADD CONSTRAINT "baselines_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."progress_events" ADD CONSTRAINT "progress_events_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "pmo"."work_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."progress_events" ADD CONSTRAINT "progress_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."progress_events" ADD CONSTRAINT "progress_events_changed_by_user_id_fk" FOREIGN KEY ("changed_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."projects" ADD CONSTRAINT "projects_pm_user_id_user_id_fk" FOREIGN KEY ("pm_user_id") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "pmo"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."work_items" ADD CONSTRAINT "work_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."work_items" ADD CONSTRAINT "work_items_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "pmo"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."work_items" ADD CONSTRAINT "work_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "pmo"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."work_items" ADD CONSTRAINT "work_items_pic_user_id_user_id_fk" FOREIGN KEY ("pic_user_id") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."work_items" ADD CONSTRAINT "work_items_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."budget_lines" ADD CONSTRAINT "budget_lines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."change_requests" ADD CONSTRAINT "change_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."change_requests" ADD CONSTRAINT "change_requests_approver_user_id_user_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."delivery_gates" ADD CONSTRAINT "delivery_gates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."raid_items" ADD CONSTRAINT "raid_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."weekly_snapshots" ADD CONSTRAINT "weekly_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."billing_term_milestones" ADD CONSTRAINT "billing_term_milestones_billing_term_id_billing_terms_id_fk" FOREIGN KEY ("billing_term_id") REFERENCES "pmo"."billing_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."billing_term_milestones" ADD CONSTRAINT "billing_term_milestones_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "pmo"."milestones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."billing_term_milestones" ADD CONSTRAINT "billing_term_milestones_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."billing_terms" ADD CONSTRAINT "billing_terms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "pmo"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmo"."import_logs" ADD CONSTRAINT "import_logs_imported_by_user_id_fk" FOREIGN KEY ("imported_by") REFERENCES "pmo"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "pmo"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "pmo"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "pmo"."verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "ms_project_idx" ON "pmo"."milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "ms_finish_idx" ON "pmo"."milestones" USING btree ("planned_finish");--> statement-breakpoint
CREATE INDEX "pe_project_time_idx" ON "pmo"."progress_events" USING btree ("project_id","changed_at");--> statement-breakpoint
CREATE INDEX "prj_portfolio_idx" ON "pmo"."projects" USING btree ("portfolio");--> statement-breakpoint
CREATE INDEX "prj_pm_idx" ON "pmo"."projects" USING btree ("pm_user_id");--> statement-breakpoint
CREATE INDEX "task_ms_idx" ON "pmo"."tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "task_project_idx" ON "pmo"."tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "wi_task_idx" ON "pmo"."work_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "wi_pic_status_idx" ON "pmo"."work_items" USING btree ("pic_user_id","status");--> statement-breakpoint
CREATE INDEX "raid_project_status_idx" ON "pmo"."raid_items" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "att_entity_idx" ON "pmo"."attachments" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "pmo"."audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_time_idx" ON "pmo"."audit_logs" USING btree ("occurred_at");