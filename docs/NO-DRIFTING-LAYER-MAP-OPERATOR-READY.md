# No-drifting map — operator-ready local loop

## Feature path

A Claude Code operator starts from a sanitized ticket scenario through the
local `operate` command. The command reads ticket text and comments, decides
the next safe move, checks only named connector readiness, scores stated
requirements, compares the saved live/staging manifests, and prints a review
packet. No external system is mounted.

## Layer map

| Layer | Local implementation | Real-provider status |
|---|---|---|
| Trigger | `tools/troubleshooting-operator/src/cli.mjs` | Basecamp loop not connected |
| Authorization | Rejects nothing by account; no provider call exists | Claude/Drive/Basecamp auth blocked |
| Orchestration | `flow.mjs` | locally tested |
| Ticket source | body + comment parser | Basecamp read unverified |
| Connector source | supplied readiness facts | connector sandbox unverified |
| Evidence home | supplied location guard | Drive write unverified |
| Staging source | supplied project manifests | Claude Project clone/write unverified |
| Operator output | JSON/skill guidance | Claude Code conversation wiring unverified |
| Monitoring | none in this local command | cloud monitoring blocked |

## Hard boundary

This branch makes the local decision logic reachable by its CLI. It must not be
presented as a real Basecamp-to-Claude-to-Drive loop until the protected pilot
proves each provider path with approved access.
