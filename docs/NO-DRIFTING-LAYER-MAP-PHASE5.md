# No-drifting check: Phase 5

| Layer | Connected path | Proof/status |
| --- | --- | --- |
| Operator entry | `/update-client-project` skill → controlled orchestration | locally tested |
| Writer | `/update-claude-project` holds the push/dry-run mechanics; front door calls it | unit tested |
| File transport | existing sync tool used as a primitive | mocked; live unverified |
| Target identity | exact live ID and candidate source link | unit tested |
| Candidate | `STAGING — ` prefix, file/source comparison | mocked; live unverified |
| Approval | Lilly approval required before candidate/live writes | unit tested |
| Behavior | original + five safety questions + open review | unit tested; live unverified |
| Promotion | approved files only | mocked integration tested |
| Live failure recovery | saved version restore + rollback result in Release Record | mocked integration tested |
| Release evidence | packet → Release Record → Updates board link | schema/docs tested; real board unverified |
| Account Skills | explicit blocker when required | unit tested; not checked live |

Sunday checks, email, client Drive, Basecamp, browser sessions, and real client
projects are intentionally not connected in this phase.
