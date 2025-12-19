# EPIC: Settings (Foundation & Governance)

## 1. Epic Purpose

The **Settings** epic establishes:

* Identity & ownership
* Governance & compliance
* Security & authorization
* Organization-level configuration
* System observability (audit & logs)

> **Everything else in the ERP assumes Settings is correct.**
> If Settings is wrong, Accounting, Stock, Assets, etc. cannot be trusted.

---

## 2. MVP Scope (What We Are and Are NOT Building)

### ✅ IN SCOPE (MVP)

* Personal account management
* Organization & user management
* RBAC (permissions, roles)
* Subscription & billing visibility
* Security configuration (MVP-level)
* Audit & access logs
* External identity integrations (Google/Microsoft – optional, gated)

### ❌ OUT OF SCOPE (MVP)

* Advanced security policies (IP allowlists, conditional access)
* Custom permission creation (permissions are platform-defined)
* Cross-org user federation
* Advanced theming / white-labeling
* Fine-grained data retention policies (defaults only)

---

## 3. Core Domain Requirements (Non-Negotiable)

### 3.1 Identity & Tenancy

* A **User** can belong to multiple **Organizations**
* A **User’s permissions are always evaluated in org context**
* One organization has:

  * Members
  * Roles (org-defined)
  * Permissions (platform-defined)

---

### 3.2 Authorization Model (MVP Lock-In)

* **Permissions are platform-owned**
* **Roles are organization-owned**
* UI visibility is permission-based
* Authorization is enforced:

  * In API middleware
  * Not in UI
  * Not in business logic

---

### 3.3 Audit & Compliance

* All sensitive actions must:

  * Emit audit events
  * Be tenant-scoped
  * Be immutable

Sensitive actions include:

* User invite/remove
* Role assignment
* Permission changes
* Subscription changes
* Security settings changes

---

### 3.4 Data Classification (Applied Here)

| Area         | Classification |
| ------------ | -------------- |
| User profile | CONFIDENTIAL   |
| Org settings | CONFIDENTIAL   |
| RBAC rules   | INTERNAL       |
| Audit logs   | RESTRICTED     |
| Access logs  | RESTRICTED     |

---

## 4. Settings – Functional Areas (MVP)

We break Settings into **subdomains**. Each becomes a backlog section.

---

# 4.1 Personal Account Settings

### Purpose

Allow users to manage their own identity without affecting others.

### Requirements

* User can update:

  * Name
  * Email (with verification)
  * Password
* User can view:

  * Active sessions
  * Login history (basic)
* User can revoke their own sessions

### Permissions

* `user.profile.manage`
* `user.sessions.manage`

---

### User Stories

**S-SET-001**

> As a user, I want to view and update my personal profile information so that my account details stay accurate.

**S-SET-002**

> As a user, I want to change my password securely so that I can protect my account.

**S-SET-003**

> As a user, I want to see all my active sessions so that I can detect suspicious access.

**S-SET-004**

> As a user, I want to revoke a specific session so that I can log out from lost or unused devices.

---

# 4.2 Organization & User Management

### Purpose

Control who belongs to an organization and what they can do.

### Requirements

* Org admins can:

  * Invite users
  * Remove users
  * Assign roles
* Invited users must:

  * Accept invitation
  * Be assigned at least one role
* Removing a user:

  * Does NOT delete their historical data
  * Revokes access immediately

### Permissions

* `org.users.invite`
* `org.users.remove`
* `org.users.assign_roles`

---

### User Stories

**S-SET-010**

> As an organization admin, I want to invite a user so that they can access the organization.

**S-SET-011**

> As an invited user, I want to accept an invitation so that I can join the organization.

**S-SET-012**

> As an organization admin, I want to remove a user so that they no longer have access.

**S-SET-013**

> As an organization admin, I want to view all organization members so that I can manage access.

---

# 4.3 RBAC Manager (Critical Sub-Epic)

### Purpose

Define **how power is distributed** inside the organization.

### Requirements

* Platform defines permissions
* Organization defines roles
* Roles are collections of permissions
* System must prevent:

  * Removing last admin
  * Assigning invalid permissions
* Permission checks must be consistent across all modules

### Permissions

* `org.roles.manage`
* `org.roles.assign`

---

### User Stories

**S-SET-020**

> As an organization admin, I want to create a role with a defined set of permissions so that responsibilities are clearly separated.

**S-SET-021**

> As an organization admin, I want to edit a role so that permissions can evolve.

**S-SET-022**

> As an organization admin, I want to assign roles to users so that access is controlled.

**S-SET-023**

> As the system, I must prevent removing the last admin role to avoid orphaned organizations.

---

# 4.4 Subscription & Billing Settings

### Purpose

Allow transparency and control over billing without deep accounting logic.

### Requirements

* Org can view:

  * Current plan
  * Usage limits
  * Billing period
* Org admin can:

  * Upgrade / downgrade plan
  * Update billing info
* Billing changes must be audited

### Permissions

* `org.billing.view`
* `org.billing.manage`

---

### User Stories

**S-SET-030**

> As an organization admin, I want to view my current subscription so that I understand my limits.

**S-SET-031**

> As an organization admin, I want to change my subscription plan so that it matches my needs.

**S-SET-032**

> As an organization admin, I want to update billing details so that payments succeed.

---

# 4.5 Security & Authentication Settings

### Purpose

Control security posture at organization level (MVP-level).

### Requirements

* Org can configure:

  * MFA requirement (on/off)
  * Session duration (default)
* MFA enforcement applies to:

  * All users
  * Or selected roles (later)

### Permissions

* `org.security.manage`

---

### User Stories

**S-SET-040**

> As an organization admin, I want to enforce MFA so that accounts are more secure.

**S-SET-041**

> As an organization admin, I want to configure session lifetime so that security policies are enforced.

---

# 4.6 Integrations (Google & Microsoft)

### Purpose

Simplify login and identity management.

### Requirements

* Enable/disable per organization
* Token-scoped access
* Clear disconnect flow

### Permissions

* `org.integrations.manage`

---

### User Stories

**S-SET-050**

> As an organization admin, I want to enable Google login so that users can authenticate easily.

**S-SET-051**

> As an organization admin, I want to disable an integration so that access can be revoked.

---

# 4.7 Access Log & Activity Log

### Purpose

Transparency, compliance, forensic capability.

### Requirements

* Access Log:

  * Login events
  * IP, device, timestamp
* Activity Log:

  * Config changes
  * RBAC changes
  * Security changes
* Logs are:

  * Read-only
  * Filterable
  * Tenant-scoped

### Permissions

* `org.logs.view`

---

### User Stories

**S-SET-060**

> As an organization admin, I want to view access logs so that I can monitor security.

**S-SET-061**

> As an organization admin, I want to view activity logs so that I can audit changes.

---

# 5. Definition of Done (Settings Epic)

Settings is considered **MVP-complete** when:

* RBAC is enforced everywhere
* Audit logs exist for all sensitive actions
* No user can access functionality without permission
* Organization cannot be orphaned
* All modules can rely on Settings as a stable foundation
