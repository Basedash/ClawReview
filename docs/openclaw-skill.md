## OpenClaw skill: request human review

Use `request_approval_from_user` whenever you need explicit human approval,
editing, or feedback before continuing a workflow.

### When to use it

- when drafting user-facing copy, plans, release notes, or summaries
- when a human should edit markdown before the workflow proceeds
- when a yes/comment/no style decision is required
- when the workflow should stop and wait for a later resumed input

### How to call it well

Provide:

- a concise, human-readable `title`
- an optional `summary`
- `contentMarkdown` with the exact draft the human should review
- a `source` object with labels when useful
- a `continuation` object containing:
  - `agentId`
  - `sessionKey`
  - optional `previousResponseId`
  - optional `gatewayBaseUrl`
  - optional `user`
  - optional `metadata`

### Continuation metadata

The review platform cannot reliably infer the current OpenClaw session from MCP
stdio calls alone, so you must include continuation metadata explicitly.

Minimum required fields:

```json
{
  "continuation": {
    "agentId": "main",
    "sessionKey": "main"
  }
}
```

If your environment uses a specific agent id or a non-default session key,
provide those exact values instead.

### Critical stop-after-tool rule

If the tool returns:

```json
{
  "status": "pending_review"
}
```

you must stop immediately.

Do **not** keep planning.
Do **not** call more tools.
Do **not** continue the workflow in the same turn.

The current run should end and wait for the later resumed session input.

### How to handle resumed review input

When the session resumes, treat the incoming review result as authoritative human
feedback. The resumed payload will include the review decision, reviewer comment,
and the final edited markdown. Continue the workflow according to that result.
