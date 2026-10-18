# Broad data access: 1 item
Labels: org-audit, priority: urgent, broad-data-access

**Priority:** urgent · **Effort:** S (under an hour) · **Severity:** high

Confirm the business need. Move to a narrower permission set, or document the exception with an owner and a review date.

From the org health audit of resume-dev run 2026-10-18.

> **Review note.** Reviewed before creation: F-001 (the org's only administrator, Dean) dropped as an accepted exception. In a single-admin demo org, the System Administrator profile is expected.

### Checklist

- [ ] F-002 User Integration User (user-2@redacted.example): View All Data via profile Analytics Cloud Integration User

### Done when

- Each listed user has a documented reason or a narrower permission set
- Exceptions have an owner and a review date

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Security setting: 12 items
Labels: org-audit, priority: urgent, security-setting

**Priority:** urgent · **Effort:** M (under a day) · **Severity:** high

Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value.

From the org health audit of resume-dev run 2026-10-18.

### Checklist

- [ ] F-021 SessionSettings: Enable clickjack protection for customer Visualforce pages with standard headers: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-022 SessionSettings: Enable clickjack protection for customer Visualforce pages with headers disabled: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-023 SessionSettings: Require HttpOnly attribute: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-024 NetworkSecurity: Number of trusted IP ranges: Org value 0, baseline 1; overall score 69
- [ ] F-027 SessionSettings: Enforce login IP ranges on every request: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-028 SessionSettings: Terminate all of a user's sessions when an admin resets that user's password: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-029 PasswordPolicies: Require a minimum 1 day password lifetime: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-031 SessionSettings: Require identity verification for email address changes: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-032 PasswordPolicies: Obscure secret answer for password resets: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-034 AdminUsers: Percentage of active internal users with System Administrator profile: Org value 14.29%, baseline 5.00%; overall score 69
- [ ] F-035 UserPIISettings: Require permission to view record names in lookup fields: Org value Disabled, baseline Enabled; overall score 69
- [ ] F-036 Identity: SAML Enabled: Org value Disabled, baseline SAML Enabled; overall score 69

### Done when

- Each setting matches the Health Check baseline or has a recorded reason

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Test coverage: 1 item
Labels: org-audit, priority: urgent, test-coverage

**Priority:** urgent · **Effort:** L (more than a day) · **Severity:** high

Run all tests, list the classes with the lowest coverage, add meaningful assertions starting with the most-changed classes.

From the org health audit of resume-dev run 2026-10-18.

### Checklist

- [ ] F-009 Org-wide Apex coverage: 0% covered (deployments to production require 75%)

### Done when

- Org-wide coverage at or above 85 percent
- New tests assert behavior, not just lines touched

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Users that never logged in: confirm they are service accounts, do not deactivate (6 items)
Labels: org-audit, priority: high, license-waste

**Priority:** high · **Effort:** M (under a day) · **Severity:** medium

Confirm each user below is a service account and record its owner. Do not deactivate the EinsteinServiceAgent user: it is the Resume Agent's run-as user, and deactivating it stops the agent. The Analytics Cloud integration and security users are created and managed by Salesforce. Reclaim a license only for a user confirmed as a person who left.

From the org health audit of resume-dev run 2026-10-18.

> **Review note.** Reviewed before creation: reworded. The audit's generic advice (freeze or deactivate) would have broken the Resume Agent, whose run-as user is on this list.

### Checklist

- [ ] F-003 User Integration User (user-2@redacted.example): License Analytics Cloud Integration User; last login never
- [ ] F-004 User EinsteinServiceAgent User (user-3@redacted.example): License Einstein Agent; last login never
- [ ] F-005 User Security User (user-4@redacted.example): License Analytics Cloud Integration User; last login never
- [ ] F-006 User Coral Cloud Agent (user-5@redacted.example): License Salesforce; last login never
- [ ] F-007 User EinsteinServiceAgent User (user-6@redacted.example): License Einstein Agent; last login never
- [ ] F-008 User EinsteinServiceAgent User (user-7@redacted.example): License Einstein Agent; last login never

### Done when

- Each listed user is confirmed as a service account with an owner, or reclaimed with a note
- The Resume Agent’s run-as user stays active

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Security setting: 5 items
Labels: org-audit, priority: high, security-setting

**Priority:** high · **Effort:** S (under an hour) · **Severity:** medium

Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value.

From the org health audit of resume-dev run 2026-10-18.

### Checklist

- [ ] F-025 PasswordPolicies: Maximum invalid login attempts: Org value 10, baseline 3; overall score 69
- [ ] F-026 SharingSettings: Number of Objects with Default External Access Set to Public: Org value 1, baseline 0; overall score 69
- [ ] F-030 PasswordPolicies: Password complexity requirement: Org value Must include alpha and numeric characters, baseline Must include alpha, numeric, and special characters; overall score 69
- [ ] F-033 PasswordPolicies: Lockout effective period: Org value 15 minutes, baseline 30 minutes; overall score 69
- [ ] F-037 SessionSettings: Lock sessions to the IP address from which they originated: Org value Disabled, baseline Enabled; overall score 69

### Done when

- Each setting matches the Health Check baseline or has a recorded reason

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Documentation gap: 10 items
Labels: org-audit, priority: normal, documentation-gap

**Priority:** normal · **Effort:** M (under a day) · **Severity:** low

Add a one-line description to each field: what it holds, who sets it, and what reads it.

From the org health audit of resume-dev run 2026-10-18.

### Checklist

- [ ] F-010 Object Account: 7 custom field(s) without a description
- [ ] F-011 Object Case: 4 custom field(s) without a description
- [ ] F-012 Object Contact: 8 custom field(s) without a description
- [ ] F-013 Object Lead: 5 custom field(s) without a description
- [ ] F-014 Object Opportunity: 5 custom field(s) without a description
- [ ] F-015 Object Goal: 1 custom field(s) without a description
- [ ] F-016 Object Metric: 1 custom field(s) without a description
- [ ] F-017 Object Booking__c: 3 custom field(s) without a description
- [ ] F-018 Object Guest_Review__c: 1 custom field(s) without a description
- [ ] F-019 Object Session__c: 3 custom field(s) without a description

### Done when

- Every listed field has a one-line description: what it holds, who sets it, what reads it

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.


# Unused configuration: 1 item
Labels: org-audit, priority: normal, unused-configuration

**Priority:** normal · **Effort:** M (under a day) · **Severity:** low

Move to an archive folder for 90 days, then delete what nobody asked for.

From the org health audit of resume-dev run 2026-10-18.

### Checklist

- [ ] F-020 102 report(s): Not run in 365 days or never run. Examples: Exercise Completion Status by Section, Exercise Completion Status, Exercise Completion by Days to Complete, Exercise Completion by User, Milestone Completion Status

### Done when

- Each item reactivated with a test, archived, or deleted with a change-log note

---

From the read-only org health audit of the gallery's Agentforce Developer Edition org, run 2026-10-18 17:44 UTC, shaped by `to-tasks.js` and reviewed by Dean on 2026-10-18 before creation. Usernames, email addresses, the org ID, and the org address are redacted.
