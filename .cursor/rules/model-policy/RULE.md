---
alwaysApply: true
---

This repository uses **multiple AI models with strictly defined responsibilities**.
Cursor must follow this policy at all times.

---

## 1) Approved Models & Responsibilities

### 1.1 Planning & Review Model  
**GPT-5.1**

**Purpose**
- Strategic planning
- Feature breakdown
- Requirement analysis
- Final review against backlog and rules

**Allowed tasks**
- Interpreting backlog items
- Planning implementation steps
- Reviewing completed work for correctness, scope, and quality
- Validating Definition of Done
- Writing or reviewing release notes

**Prohibited**
- Writing production code
- Making direct code changes
- Performing refactors or migrations

---

### 1.2 Architecture & Refactoring Model  
**GPT-5.2**

**Purpose**
- System-level reasoning
- Architectural validation
- Refactoring and migration planning

**Allowed tasks**
- Architecture design and review
- Refactor proposals
- Migration strategies
- Cross-cutting concern analysis (auth, multi-tenancy, async flows)
- Identifying technical debt and improvement paths

**Prohibited**
- Direct implementation of features
- Writing production code
- Executing backlog items

---

### 1.3 Thinking & Reasoning Model  
**Sonnet 4.5 (Thinking mode)**

**Purpose**
- Deep reasoning on complex problems
- Tradeoff analysis
- Edge-case exploration

**Allowed tasks**
- Exploring alternative designs
- Analyzing failure modes
- Reasoning about offline sync, queues, data consistency
- Answering “what if” and “should we” questions

**Prohibited**
- Writing production code
- Making structural changes
- Implementing backlog items

---

### 1.4 Code Implementation Model  
**Sonnet 4.5 (Standard / Code)**

**Purpose**
- Precise, rule-following implementation

**Allowed tasks**
- Implementing backlog requirements
- Writing API (tRPC) procedures
- Implementing workers and queue consumers
- Writing Drizzle schemas and migrations
- Implementing MongoDB projections
- Writing tests
- Updating required documentation

**Requirements**
- Must follow `.cursor/rules/*`
- Must follow Definition of Done
- Must not expand scope beyond backlog files
- Must keep diffs minimal and localized

---

## 2) Model Usage Flow (Mandatory)

For any backlog item:

1. **Planning**
   - Use **GPT-5.1**
   - Understand requirements and scope
   - Identify risks and unknowns

2. **Architecture / Refactor (if needed)**
   - Use **GPT-5.2**
   - Produce plans only, no code

3. **Implementation**
   - Use **Sonnet 4.5 (Code)**
   - Implement exactly what is defined

4. **Review**
   - Use **GPT-5.1**
   - Validate against backlog, rules, and Definition of Done

Model switching **within the same phase is not allowed**.

---

## 3) Model Lock Rule

- Once a model is selected for a phase, it must be used until that phase is complete.
- Cursor must not switch models mid-implementation.
- If a different model is needed, execution must stop and restart at the correct phase.

---

## 4) Prohibited Behavior (All Models)

No model may:
- Invent new architecture
- Modify backlog files without instruction
- Expand feature scope
- Bypass auth, validation, or tenant isolation
- Silence errors to “make it work”
- Introduce new libraries or frameworks without approval

---

## 5) Conflict Resolution

If model outputs conflict:
- **Backlog > Cursor rules > Definition of Done > Model output**
- Lower-priority output must be discarded.

---

## 6) Enforcement

If a task violates this policy:
- The task is considered **invalid**
- The implementation must be reverted
- The task must be re-executed with the correct model

---

## 7) Final Rule

**Model intelligence does not override process discipline.**

Correct execution with the right model is mandatory.
