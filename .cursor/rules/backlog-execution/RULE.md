---
alwaysApply: true
---

All feature and bug work must be driven from the **versioned backlog** structure.
Cursor must treat the backlog as the **single source of truth for scope**.

---

## 1) Backlog Structure (Mandatory)

Work items must live under:

backlog/
  vX.Y.Z/
    <feature-or-area-name>/
      requirement_*.md
      bug_*.md
      spike_*.md (optional)

Rules:
- `vX.Y.Z` represents the **target release version**
- Each feature folder groups related work
- Each file represents **one atomic unit of work**
- Cursor must not implement work that does not exist in the backlog

---

## 2) How Cursor Must Approach a Backlog Item

For **each** backlog file Cursor works on, it must:

1) Read the file fully before writing any code
2) Treat the file content as **binding requirements**
3) Implement only what is explicitly defined
4) Respect all project rules and Definition of Done

Cursor must **not**:
- Infer missing requirements
- Expand scope “to be helpful”
- Combine multiple backlog files unless explicitly instructed

---

## 3) Questions, Ambiguities, and Assumptions

If **any requirement is unclear**, Cursor must:

1) Stop implementation
2) Create or update a clarification file under:
   docs/decisions/

Example:
docs/decisions/
  v1.0.0-feature-x-clarifications.md

The clarification document must include:
- The original question
- Available options
- The chosen assumption (if forced to proceed)
- Impact and risks of that assumption

Cursor must **never silently guess**.

---

## 4) Changes During Execution

If implementation reveals that:
- a requirement is incomplete
- a requirement is incorrect
- a technical constraint forces deviation

Then Cursor must:

1) Document the change in:
   docs/changes/

Example:
docs/changes/
  v1.0.0-feature-x-changes.md

2) Clearly state:
   - what changed
   - why it changed
   - whether the backlog file should be updated

Cursor must not “fix” backlog files silently.

---

## 5) Implementation Traceability (Required)

Every backlog item implemented must be traceable.

For each `requirement_*.md` or `bug_*.md`, Cursor must be able to answer:
- Which files were changed
- Which domain services / procedures were added or modified
- Which tests cover this work

This information must be summarized in the PR or task output.

---

## 6) Documentation Obligations

If a backlog item introduces or modifies:
- architecture
- domain behavior
- events
- background jobs
- external integrations

Then Cursor must update the appropriate docs:
- docs/architecture.md
- docs/events.md
- docs/runbook.md
- or create a new doc if needed

Documentation updates are part of the Definition of Done.

---

## 7) Release Notes Compatibility (Non-Optional)

Each backlog item must be written and implemented so it can map **directly** to release notes.

Rules:
- Each backlog file = one release note entry
- Cursor must not merge multiple backlog items into one implementation without approval
- Implementation summaries must be written in **user-facing language**, not internal code terms

This enables automatic generation of:
- CHANGELOG.md
- GitHub/GitLab releases
- internal release notes

---

## 8) Prohibited Actions

Cursor must NOT:
- Implement features without a backlog file
- Modify backlog files unless explicitly instructed
- Close multiple backlog items with one undocumented change
- Skip documentation to “move faster”

---

## 9) Completion Gate

A backlog item is considered complete only when:
- Code is implemented
- Tests pass
- Documentation is updated
- Definition of Done is fully satisfied
- The item can be cleanly included in release notes

If any of these are missing, the backlog item remains **OPEN**.
