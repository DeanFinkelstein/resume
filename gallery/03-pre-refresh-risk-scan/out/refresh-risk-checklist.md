# Pre-refresh risk checklist: resume-dev

Read-only scan run 2026-10-17. 16 automated checks plus 9 manual ones. Nothing in the org was changed.
Usernames, email addresses, the org ID, and the org address are redacted in this copy.


Every item below is either backed up, recreated after the refresh, or dropped on purpose. Tick the box when it has an owner.

## Summary

| Check | Found | Action before refresh |
|---|---|---|
| Scheduled jobs | 3 | Record class, schedule, and running user. Reschedule after the refresh. |
| Connected apps | 0 | List which integration uses each app and who re-authorizes it. |
| Granted OAuth tokens | 1 | For each app and user, plan the re-authentication and who does it. |
| Named credentials | 1 | Re-enter each credential after the refresh. Know where the secret lives before you start. |
| External credentials | 0 | Re-enter principal secrets after the refresh. |
| Auth providers and SSO | 0 | Update callback URLs on the identity provider side. Test SSO login first thing after the refresh. |
| Remote site settings and CSP trusted sites | 7 | Re-add sandbox-only endpoints after the refresh. |
| Certificates | 0 | Confirm each certificate is still valid for its purpose after the refresh. |
| Sites and Experience Cloud sites | 4 | Note each site, its domain, and its guest user profile. Test guest access after the refresh. |
| Custom setting data | 0 | Export each custom setting now. Re-import the sandbox-only values after the refresh. |
| Custom metadata records | 0 | Retrieve custom metadata to source control before the refresh so sandbox-only values can be redeployed. |
| Users that look like integration or service accounts | 3 | For each one: who owns it, how it authenticates, and who resets it after the refresh. |
| Setup changes in the last 90 days | 41 | Check each change against source control. Retrieve anything missing before the refresh. |
| Platform event and change data capture subscribers | 0 | Tell each subscriber owner to reset replay IDs after the refresh. |
| Email services | 0 | Record each address and who sends to it. Update the senders after the refresh. |
| Custom object record counts | 4 | Export anything you need to keep. Decide per object. |

## Scheduled jobs

Scheduled Apex, scheduled reports, and dashboard refreshes do not survive a refresh. Each one is rescheduled by hand or by a post-copy script.

| Assigned | name | type | state | next | cron | runsAs |
|---|---|---|---|---|---|---|
| [ ] | Metalytics Data Loader Job for Org : 00D-redacted | system job (type code K) | WAITING | 2026-10-17T05:17:00.000+0000 | 0 17 22 ? * 1,2,3,4,5,6,7 | Integration User |
| [ ] | Program Milestone Computation Cron Job | system job (type code P) | WAITING | 2026-10-17T06:59:00.000+0000 | 0 59 6,11,16,23 ? * * | Automated Process |
| [ ] | Program Status Update Cron Job | system job (type code S) | WAITING | 2026-10-17T12:00:00.000+0000 | 0 0 5,20 ? * * | Automated Process |

Action: Record class, schedule, and running user. Reschedule after the refresh.

## Connected apps

Connected apps copy over, but the tokens users and integrations granted do not. Every integration that authenticates through one re-authorizes against the new sandbox.

Nothing found.

## Granted OAuth tokens

Tokens are tied to the org copy they were issued in. After the refresh, every one of these is dead.

| Assigned | app | user | lastUsed | uses |
|---|---|---|---|---|
| [ ] | Salesforce CLI | user-1@redacted.example | 2026-10-17 | 1 |

Action: For each app and user, plan the re-authentication and who does it.

## Named credentials

The definitions copy over. The stored passwords, tokens, and certificates behind them do not.

| Assigned | name | modified | by |
|---|---|---|---|
| [ ] | Weather_Endpoint | 2026-10-16 | Dean Finkelstein |

Action: Re-enter each credential after the refresh. Know where the secret lives before you start.

## External credentials

Same as named credentials: the principal secrets have to be re-entered.

Nothing found.

## Auth providers and SSO

Auth providers and SAML configurations copy over, but callback URLs change with the sandbox domain, and identity providers may need the new URLs.

Nothing found.

## Remote site settings and CSP trusted sites

These copy over from Production. Any endpoint that exists only for the sandbox (a test API, a staging host) disappears.

| Assigned | name | modified | by | kind |
|---|---|---|---|---|
| [ ] | ApexDevNet | 2026-10-16 | Dean Finkelstein | RemoteSiteSetting |
| [ ] | Cloudniary | 2026-10-16 | Dean Finkelstein | CspTrustedSite |
| [ ] | MIAW | 2026-10-16 | Dean Finkelstein | CspTrustedSite |
| [ ] | Slack | 2026-10-16 | Automated Process | CspTrustedSite |
| [ ] | s3_us_west_2_amazonaws_com | 2026-10-16 | Dean Finkelstein | CspTrustedSite |
| [ ] | Visualforce | 2026-10-16 | Dean Finkelstein | CspTrustedSite |
| [ ] | S3 | 2026-10-16 | Dean Finkelstein | CspTrustedSite |

Action: Re-add sandbox-only endpoints after the refresh.

## Certificates

Certificates copy over, but anything signed for the old sandbox domain or a sandbox-only integration needs checking.

Nothing found.

## Sites and Experience Cloud sites

Site definitions copy over. Domains, guest user settings, and any sandbox-only site configuration need checking.

| Assigned | name | modified | by | kind |
|---|---|---|---|---|
| [ ] | coral_cloud | 2026-10-17 | Dean Finkelstein | CustomSite |
| [ ] | ESW_ESA_Web_Deployment_1724800920657 | 2026-10-17 | Dean Finkelstein | CustomSite |
| [ ] | ESW_ESA_Web_Deployment_1724800920657 | 2026-10-16 | Dean Finkelstein | Network |
| [ ] | coral-cloud | 2026-10-16 | Dean Finkelstein | Network |

Action: Note each site, its domain, and its guest user profile. Test guest access after the refresh.

## Custom setting data

Custom setting records are data. A refresh replaces them with Production values. Sandbox-only values (test endpoints, feature switches, kill switches) are lost.

Nothing found.

## Custom metadata records

Custom metadata copies over from Production, overwriting any sandbox-only record values.

Nothing found.

## Users that look like integration or service accounts

After a refresh every user email gets .invalid appended, passwords are reset, and sessions end. Human users notice. Integration users fail silently at 2 a.m.

| Assigned | name | username | profile | lastLogin |
|---|---|---|---|---|
| [ ] | Dean Finkelstein | user-1@redacted.example | System Administrator | 2026-10-17 |
| [ ] | Integration User | user-2@redacted.example | Analytics Cloud Integration User |  |
| [ ] | EinsteinServiceAgent User | user-3@redacted.example | Custom Einstein Agent User |  |

Action: For each one: who owns it, how it authenticates, and who resets it after the refresh.

## Setup changes in the last 90 days

Configuration done in the sandbox and not yet in source control is overwritten by the refresh. The audit trail shows what changed and who did it.

| Assigned | when | section | action | detail | by |
|---|---|---|---|---|---|
| [ ] | 2026-10-17 | Manage Users | changedpassword | Set new password for user Dean Finkelstein (UserID: [005aj00000gAb69]) | Dean Finkelstein |
| [ ] | 2026-10-17 | Manage Users | changedUserEmailVerifiedStatusVerified | For user user-1@redacted.example, the User Verified Email status changed to verified | Automated Process |
| [ ] | 2026-10-17 |  | einsteinGPTPlatformEnabledOffOn | Organization setup action: einsteinGPTPlatformEnabledOffOn has changed. | Automated Process |
| [ ] | 2026-10-17 |  | agentPlatformEnabledOffOn | Organization setup action: agentPlatformEnabledOffOn has changed. | Automated Process |
| [ ] | 2026-10-17 |  | value_MAX_STREAMING_TOPICS_PROV | Max number of streaming topics |  |
| [ ] | 2026-10-17 |  | reqFirstPartyUseOfCookiesOnOff | Disabled the My Domain policy Require first-party use of Salesforce cookies | Dean Finkelstein |
| [ ] | 2026-10-17 |  | inviteCsnUserEnabledOnOff | Organization setup action: inviteCsnUserEnabledOnOff has changed. | Dean Finkelstein |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SetupWithAgentforceUserPsg: ExecutePromptTemplates permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SetupWithAgentforceUserPsg: EinsteinMetadataUserAccess permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationComplete | Permission set group calculation completed : SetupWithAgentforceUserPsg |  |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SetupWithAgentforceUserPsg: UseSetupWithAgentforce permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationStarted | Permission set group calculation started : SetupWithAgentforceUserPsg |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationComplete | Permission set group calculation completed : SalesCloudSeller |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationStarted | Permission set group calculation started : SalesCloudSeller |  |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SalesCloudSeller: ViewOnlyEmbeddedAppUser permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SalesCloudSeller: StdAutomaticActivityCapture permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Manage Users | PermSetEnableUserPerm | Changed permission set Platform Metabolism Slagent Permset: View Roles and Role Hierarchy permission was changed from disabled to enabled | Automated Process |
| [ ] | 2026-10-16 | Manage Users | PermSetEnableUserPerm | Changed permission set Platform Metabolism Slagent Permset: Manage AI Agents permission was changed from disabled to enabled | Automated Process |
| [ ] | 2026-10-16 | Manage Users | PermSetAssign | Permission set Platform Metabolism Slagent Permset: assigned to user Platform Integration User (UserID: [005aj00000gAb7p]) | Automated Process |
| [ ] | 2026-10-16 | Manage Users | PermSetEnableUserPerm | Changed permission set Platform Metabolism Slagent Permset: View Setup and Configuration permission was changed from disabled to enabled | Automated Process |
| [ ] | 2026-10-16 | Manage Users | PermSetCreate | Created permission set Platform Metabolism Slagent Permset: with User License Cloud Integration User | Automated Process |
| [ ] | 2026-10-16 | Lightning Pages | createdFlexiPage | Created Lightning Page: Command Center App Utility Bar | Automated Process |
| [ ] | 2026-10-16 | Field Restriction Rule | abacRuleUpdatedGeneral | Updated user rule Rule49e92ad5826b458cf1fd8c22a20d593e9c0be0d16944a7b45c8d753caaef124b. | Automated Process |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SalesCloudCallCoachingSeller: ViewOnlyEmbeddedAppUser permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermSetGroupUserPermEnabled | Changed permission set group SalesCloudCallCoachingSeller: StdAutomaticActivityCapture permission was changed from disabled to enabled |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationComplete | Permission set group calculation completed : SalesCloudCallCoachingSeller |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCreate | Created permission set group SetupWithAgentforceUserPsg |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCalculationStarted | Permission set group calculation started : SalesCloudCallCoachingSeller |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCreate | Created permission set group SalesCloudCallCoachingSeller |  |
| [ ] | 2026-10-16 | Permission Set Group | PermissionSetGroupCreate | Created permission set group SalesCloudSeller |  |
| [ ] | 2026-10-16 |  | value_MAX_STREAMING_TOPICS_PROV | Max number of streaming topics |  |
| [ ] | 2026-10-16 |  | scoringFrameworkOrgPrefOffOn | Organization setup action: scoringFrameworkOrgPrefOffOn has changed. |  |
| [ ] | 2026-10-16 |  | tableauSlackCollabEnabledOffOn | Organization setup action: tableauSlackCollabEnabledOffOn has changed. | Automated Process |
| [ ] | 2026-10-16 |  | value_ORG_CREATED_ON_VERSION | Changed OrgCreatedOnVersion from 264.0 to 264.0 | Dean Finkelstein |
| [ ] | 2026-10-16 | Event Manager | eventManagerEventDestinationEnableStore | Automated Process enabled storing on Security Defense Action Event. | Automated Process |
| [ ] | 2026-10-16 | Sharing Defaults | externalSharingModelEnabled | Enabled External Sharing Model | Dean Finkelstein |
| [ ] | 2026-10-16 |  | value_CASE_FEEDS_JOB_STATUS | Case Feeds Job Status | Dean Finkelstein |
| [ ] | 2026-10-16 | Experiences Setup | changedNetworksOn | Experiences enabled | Dean Finkelstein |
| [ ] | 2026-10-16 |  | value_CASE_FEEDS_PROCESSING_STATE | Case Feeds Processing State | Dean Finkelstein |
| [ ] | 2026-10-16 | Sharing Defaults | secureGuestUserRecordAccessEnabled | Enabled Secure Guest User Record Access | Dean Finkelstein |
| [ ] | 2026-10-16 |  | enablementEnabledOffOn | Organization setup action: enablementEnabledOffOn has changed. | Dean Finkelstein |

Action: Check each change against source control. Retrieve anything missing before the refresh.

## Platform event and change data capture subscribers

External subscribers hold replay positions for this org copy. After the refresh they reconnect to a new org with new IDs.

Nothing found.

## Email services

Email service addresses are regenerated with the new sandbox domain. Anything that sends mail to them points at a dead address.

Nothing found.

## Custom object record counts

A Full or Partial refresh replaces data. Records that exist only in the sandbox (test data, in-progress configuration data) are gone. Developer and Developer Pro sandboxes keep no data at all.

| Assigned | object | label | records |
|---|---|---|---|
| [ ] | Booking__c | Booking | 8656 |
| [ ] | Experience__c | Experience | 54 |
| [ ] | Guest_Review__c | Guest Review | 10 |
| [ ] | Session__c | Experience Session | 6102 |

Action: Export anything you need to keep. Decide per object.

## Manual checks

- [ ] Email deliverability: a refreshed sandbox is set to System email only. Decide whether to raise it, and tell testers.
- [ ] Email masking: user emails get .invalid appended. Fix the handful that need real mail (integration owners, testers).
- [ ] Outbound messages, callouts, and webhooks: any endpoint that pointed at the old sandbox URL (My Domain changes) must be updated on the other side.
- [ ] Login IP ranges and trusted IPs on profiles: confirm they match what the sandbox users need.
- [ ] Debug logs, trace flags, and Apex test settings: all reset.
- [ ] Data masking or Data Mask templates: rerun after the refresh if the client requires it.
- [ ] Installed package license assignments: recheck user assignments after the refresh.
- [ ] Report and dashboard subscriptions: recreate.
- [ ] Sandbox post-copy script (an Apex class implementing SandboxPostCopy): the right place to automate everything above that repeats. If there is none, that is a finding too.

Generated by scan.js in 67 seconds.
