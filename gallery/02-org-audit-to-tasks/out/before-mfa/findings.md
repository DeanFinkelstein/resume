# Org health audit: resume-dev

Read-only scan run 2026-10-17. 36 findings: 16 high, 9 medium, 11 low. Nothing in the org was changed.
Usernames, email addresses, the org ID, and the org address are redacted in this copy.


## Checks run

| Check | Findings |
|---|---|
| Users with Modify All Data or View All Data | 2 |
| Active users with no login in 90 days | 4 |
| Workflow rules and Process Builder still active | 0 |
| Active flows below API 55 | 0 |
| Apex classes and triggers below API 55 | 0 |
| Org-wide Apex test coverage | 1 |
| Inactive validation rules | 0 |
| Custom fields without a description | 10 |
| Reports not run in a year | 1 |
| Security Health Check | 18 |
| Org limits above 80 percent | 0 |

## Findings

| ID | Severity | Check | Component | Detail | Recommendation | Effort |
|---|---|---|---|---|---|---|
| F-001 | high | Broad data access | User Dean Finkelstein (user-1@redacted.example) | Modify All Data via profile System Administrator | Confirm the business need. Move to a narrower permission set, or document the exception with an owner and a review date. | S |
| F-002 | high | Broad data access | User Integration User (user-2@redacted.example) | View All Data via profile Analytics Cloud Integration User | Confirm the business need. Move to a narrower permission set, or document the exception with an owner and a review date. | S |
| F-019 | high | Security setting | SessionSettings: Enable clickjack protection for customer Visualforce pages with standard headers | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-020 | high | Security setting | SessionSettings: Enable clickjack protection for customer Visualforce pages with headers disabled | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-021 | high | Security setting | SessionSettings: Require HttpOnly attribute | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-022 | high | Security setting | Identity: MFA Enabled | Org value Disabled, baseline MFA Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-023 | high | Security setting | NetworkSecurity: Number of trusted IP ranges | Org value 0, baseline 1; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-026 | high | Security setting | SessionSettings: Enforce login IP ranges on every request | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-027 | high | Security setting | SessionSettings: Terminate all of a user's sessions when an admin resets that user's password | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-028 | high | Security setting | PasswordPolicies: Require a minimum 1 day password lifetime | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-030 | high | Security setting | SessionSettings: Require identity verification for email address changes | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-031 | high | Security setting | PasswordPolicies: Obscure secret answer for password resets | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-033 | high | Security setting | AdminUsers: Percentage of active internal users with System Administrator profile | Org value 20.00%, baseline 5.00%; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-034 | high | Security setting | UserPIISettings: Require permission to view record names in lookup fields | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-035 | high | Security setting | Identity: SAML Enabled | Org value Disabled, baseline SAML Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-007 | high | Test coverage | Org-wide Apex coverage | 0% covered (deployments to production require 75%) | Run all tests, list the classes with the lowest coverage, add meaningful assertions starting with the most-changed classes. | L |
| F-003 | medium | License waste | User Integration User (user-2@redacted.example) | License Analytics Cloud Integration User; last login never | Confirm with the manager, then freeze or deactivate and reclaim the license. Check first whether it is an integration user. | S |
| F-004 | medium | License waste | User EinsteinServiceAgent User (user-3@redacted.example) | License Einstein Agent; last login never | Confirm with the manager, then freeze or deactivate and reclaim the license. Check first whether it is an integration user. | S |
| F-005 | medium | License waste | User Security User (user-4@redacted.example) | License Analytics Cloud Integration User; last login never | Confirm with the manager, then freeze or deactivate and reclaim the license. Check first whether it is an integration user. | S |
| F-006 | medium | License waste | User Coral Cloud Agent (user-5@redacted.example) | License Salesforce; last login never | Confirm with the manager, then freeze or deactivate and reclaim the license. Check first whether it is an integration user. | S |
| F-024 | medium | Security setting | PasswordPolicies: Maximum invalid login attempts | Org value 10, baseline 3; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-025 | medium | Security setting | SharingSettings: Number of Objects with Default External Access Set to Public | Org value 1, baseline 0; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-029 | medium | Security setting | PasswordPolicies: Password complexity requirement | Org value Must include alpha and numeric characters, baseline Must include alpha, numeric, and special characters; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-032 | medium | Security setting | PasswordPolicies: Lockout effective period | Org value 15 minutes, baseline 30 minutes; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-036 | medium | Security setting | SessionSettings: Lock sessions to the IP address from which they originated | Org value Disabled, baseline Enabled; overall score 64 | Align with the baseline unless there is a documented reason not to. Record the reason if you keep the current value. | S |
| F-008 | low | Documentation gap | Object Account | 7 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-009 | low | Documentation gap | Object Case | 4 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-010 | low | Documentation gap | Object Contact | 8 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-011 | low | Documentation gap | Object Lead | 5 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-012 | low | Documentation gap | Object Opportunity | 5 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-013 | low | Documentation gap | Object Goal | 1 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-014 | low | Documentation gap | Object Metric | 1 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-015 | low | Documentation gap | Object Booking__c | 3 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-016 | low | Documentation gap | Object Guest_Review__c | 1 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-017 | low | Documentation gap | Object Session__c | 3 custom field(s) without a description | Add a one-line description to each field: what it holds, who sets it, and what reads it. | S |
| F-018 | low | Unused configuration | 102 report(s) | Not run in 365 days or never run. Examples: Exercise Completion Status by Section, Exercise Completion Status, Exercise Completion by Days to Complete, Exercise Completion by User, Milestone Completion Status | Move to an archive folder for 90 days, then delete what nobody asked for. | M |

Effort: S is under an hour, M is under a day, L is more than a day.

Generated by audit.js in 44 seconds.
