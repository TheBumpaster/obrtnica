# AI Model Usage Policy

This document defines **which AI models are used for which types of work** and **how they must be applied** when working in this repository using Cursor.

The goal is to maximize **code quality, consistency, and long-term maintainability**, while avoiding architectural drift and uncontrolled AI behavior.

---

## 1) Core Principles

- AI models are **tools**, not decision-makers.
- The backlog (`/backlog`) defines *what* is built.
- `.cursor/rules` define *how* it is built.
- Model choice determines *how well* those rules are followed.

No model may override:
- backlog scope
- Cursor rules
- Definition of Done
- architectural constraints

---

## 2) Approved Models & Roles

### 2.1 Primary Execution Model (Default)

**Claude 4.5 Sonnet (latest available)**

**Role**
- Primary implementation model
- Default choice for all backlog execution

**Allowed tasks**
- Implementing backlog requirements
- Writing API (tRPC) procedures
- Implementing workers and RabbitMQ consumers
- Writing Drizzle schemas and migrations
- Implementing MongoDB projections
- Writing tests (unit + integration)
- Updating documentation required by Definition of Done

**Why**
- Strong rule adherence
- Minimal-diff behavior
- Excellent TypeScript discipline
- High reliability in large monorepos

**Policy**
- All backlog execution MUST use this model unless explicitly stated otherwise.
- Do not switch models mid-implementation.

---

### 2.2 Architecture & Review Model

**GPT-5.1 / GPT-5.1 High**

**Role**
- Reviewer and challenger
- Design validation

**Allowed tasks**
- Architecture reviews
- Security and auth flow reviews
- Multi-tenancy and permission modeling
- Event schema review
- Failure mode analysis
- Reviewing completed implementations against rules

**Not allowed**
- Large code generation
- Full feature implementation
- Bulk refactors

**Policy**
- Use after implementation, not during.
- Findings must be applied using the primary execution model.

---

### 2.3 Heavy Reasoning / Planning Model (Optional)

**GPT-5.2 or Gemini 3 Pro**

**Role**
- High-level reasoning and planning only

**Allowed tasks**
- Large refactor planning
- Migration strategy design
- Performance analysis across subsystems
- Cross-cutting architectural exploration

**Not allowed**
- Writing production code directly
- Making structural changes without backlog items

**Policy**
- Output is advisory only.
- Execution must always be done by the primary model.

---

## 3) Model Selection Rules

### 3.1 Per-Task Model Lock
Once a model is chosen for a task:
- It must be used **until the backlog item is complete**
- Model switching mid-task is prohibited

### 3.2 One Model per Responsibility
- Execution → Claude
- Review → GPT-5.1
- Planning → GPT-5.2 / Gemini

Do not mix responsibilities in a single step.

---

## 4) Backlog-Driven Enforcement

For any backlog item:
- Cursor must state which model is being used
- The model must match the task category
- Any deviation must be explicitly justified

Example:
> “Using GPT-5.2 for architecture review only. Implementation will be done with Claude 4.5 Sonnet.”

---

## 5) Prohibited Model Usage

AI models must NOT:
- Invent new architecture
- Expand backlog scope
- Introduce new libraries without approval
- Bypass auth, validation, or tenant isolation
- Silence errors to “make things work”

These rules apply **regardless of model capability**.

---

## 6) Quality Over Speed Rule

If a model:
- becomes sloppy
- ignores rules
- introduces unnecessary abstractions
- fails to respect minimal diffs

Then:
- Stop
- Re-run the task with the primary execution model
- Do not “patch” poor AI output manually

---

## 7) Recommended Default Setup in Cursor

If Cursor allows defaults:
- Set **Claude 4.5 Sonnet** as the global default
- Manually switch to GPT-5.1 for reviews only
- Use GPT-5 / Gemini sparingly and intentionally

---

## 8) Final Note

Consistency beats intelligence.

A slightly “weaker” model that:
- follows rules
- respects scope
- produces predictable diffs

is always preferred over a “smarter” model that improvises.

This policy exists to ensure the system remains:
- maintainable
- auditable
- scalable
- human-reviewable
