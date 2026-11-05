# Wake `{team}-intake` from a Discord role mention

After you import the **frontdesk-pipeline** template, the website should open tickets by posting into the triage Discord channel a message that starts with:

```text
<@&ROLE_ID>-intake
```

followed by the ticket text (number, project, description).

Discord turns `<@&ROLE_ID>` into a role pill. Switch rewrites that pill to `@RoleName`. The literal `-intake` after it becomes part of the address, so the room sees:

```text
@RoleName-intake …
```

That only wakes your intake agent if **RoleName** is exactly the template’s `{team}` prefix (for example `frontdesk` → agent `frontdesk-intake`).

No real role IDs or tokens appear below — use the values from your own Discord server.

---

## 1. Know your team prefix

1. When you ran the template, you set **team** (letters, digits, hyphens).
2. Intake’s registered name is `{team}-intake` (example: team `frontdesk` → `frontdesk-intake`).
3. The Discord **role name** you need in the next step is only `{team}` — not the full agent name.

---

## 2. Confirm intake is in the Discord triage room

1. Open Switch Console → **Your Rooms** → the room named `{team}-triage` (bridged to Discord).
2. Confirm `{team}-intake` is listed as a member and is running.
3. If it is missing, invite it from the channel:

```text
!invite-agent @{team}-intake
```

or use Discord’s `/invite-agent` and pick that agent.

---

## 3. Find or create the Discord role named `{team}`

1. In Discord, open your server → **Server Settings** → **Roles**.
2. Look for a role whose **name is exactly** your team prefix (for example `frontdesk`).
   - Switch may also create roles named like full agent names (`frontdesk-intake`). Those are for mentioning the agent alone as `<@&…>`. For the website’s `<@&…>-intake` pattern you need the **short** role named only `{team}`.
3. If that short role does not exist, create it:
   - **Create Role** → name it exactly `{team}` (lowercase to match the agent name).
   - You do not need special permissions on this role; it is only used as an address token.
4. Leave the role available in the server (no need to assign it to people for this to work).

---

## 4. Copy the Discord role ID

1. In Discord: **User Settings** → **Advanced** → turn on **Developer Mode**.
2. Open **Server Settings** → **Roles**.
3. Right-click the `{team}` role → **Copy Role ID**.
4. That value is `ROLE_ID` in `<@&ROLE_ID>-intake`. Keep it in your website/webhook config only — do not commit it to the public template.

---

## 5. (Optional) Set a Switch room alias for humans

Aliases are separate from the website role trick. They let people type a short `@name` in the channel.

**From the Discord channel:**

1. List what is taken: `!list-aliases` (or `/list-aliases`).
2. Point an alias at intake (agent first, then alias):

```text
!set-alias @{team}-intake @{team}
```

Discord slash form: `/set-alias` → agent = `{team}-intake`, alias = `{team}`.

**From Switch Console:**

1. Open the room: **Your Rooms** → `{team}-triage` (or the room link under Rooms).
2. Find **Aliases** (room detail / configuration).
3. Map agent `{team}-intake` → alias `{team}` (or clear/replace an old mapping).
4. Save if the UI asks you to.

After this, `@team` in that room addresses intake the same way as `@{team}-intake`. It does **not** replace the website’s `<@&ROLE_ID>-intake` string; keep both if you use both.

---

## 6. Point the website at the channel

1. Configure the webhook or bot that posts new tickets to post into the **same Discord channel** that is the Switch room `{team}-triage`.
2. Message body must **start with** (no leading space before the mention):

```text
<@&ROLE_ID>-intake
```

3. Then the ticket payload on the following lines or the same line (ticket id, project, description) as your intake instructions expect.
4. Do not put secrets in the Discord message. Do not put Switch tokens or Discord bot tokens in the channel.

---

## 7. Test it

1. From any account that can post in the channel, send a dry-run message such as:

```text
<@&ROLE_ID>-intake
[HD-0] Project: test | Type: bug | Summary: alias wiring check | Steps: n/a | Expected: intake replies | Actual: testing
```

   Replace `ROLE_ID` with the id you copied (still your private value).

2. Confirm in Discord that the role pill renders (not raw `<@&…>` text). If it stays raw, the role id is wrong or from another server.
3. Confirm `{team}-intake` replies (or at least starts a turn). In Switch Console, open that agent’s session for the triage room if you need to see why it stayed quiet.
4. If nothing wakes:
   - Intake not in the room, or stopped → invite / start it.
   - Role **name** is not exactly `{team}` → rename the role or change the website suffix so `@RoleName-intake` matches the registered agent name.
   - Addressing is not **anyone** on intake → people/webhooks outside owner-agents cannot wake it.
   - Message did not start with the mention (extra characters or a different channel).
5. Optional alias check: post `@{team} hello` (or the alias you set). Intake should answer the same way.

---

## Quick reference

| Piece | Must be |
| --- | --- |
| Template `team` | Prefix used in every agent name |
| Discord role name | Exactly `{team}` |
| Website prefix | `<@&ROLE_ID>-intake` |
| Switch agent woken | `{team}-intake` |
| Optional room alias | `{team}` → `{team}-intake` for human `@` mentions |
