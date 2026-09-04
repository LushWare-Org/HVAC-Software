# Multi-technician assignment — technician app and customer comms

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every crew member sees the job in the mobile app and can complete their
own work, only the lead moves the job's status, and the customer is told about
the whole crew with photos rather than one name.

**Architecture:** `Job.crewUserIds` already exists and is maintained by
scheduling-service. This adds a `crewUserId` filter to the jobs list so the
mobile app's "my jobs" query stays one call, threads the crew through the
en-route notification payload, and renders it in the email and the portal.

**Tech Stack:** NestJS + Prisma (job-service, comms-service), Go (scheduling),
Expo/React Native (technician-app), React (customer-portal).

**Spec:** `docs/superpowers/specs/2026-09-02-multi-technician-assignment-design.md`

## Global Constraints

- **pnpm only.** The `preinstall` hook rejects npm and yarn.
- **Multi-tenancy:** every query filters on `companyId`.
- **`class-validator` foot-guns:** `@MaxLength` only checks strings (use `@Max`
  for numbers); nested DTOs need `@ValidateNested({ each: true }) @Type(() => Dto)`
  or `whitelist: true` strips them silently. **This bites in Task 3.**
- **Status enums are UPPER_SNAKE_CASE.**
- **No em dashes as connectors** in user-facing copy.
- **Do not commit** unless a step says to. No Claude co-author trailer.

---

## Task 1: Filter jobs by crew membership

**Files:**
- Modify: `apps/job-service/src/jobs/jobs.service.ts` (filters type ~line 140, where-clause ~line 168)
- Modify: `apps/job-service/src/jobs/jobs.controller.ts` (findAll query params)

**Interfaces:**
- Produces: `GET /jobs/jobs?crewUserId=<userId>` returning jobs where that user is
  anywhere in the crew, lead or not.

- [ ] **Step 1: Add the filter to the service**

In `jobs.service.ts`, add to the `filters` type beside `assignedToId`:

```ts
      /** Matches anyone in the crew, lead or not. assignedToId only matches the
       *  lead, so a helper would never see their own job without this. */
      crewUserId?: string;
```

and beside the existing `assignedToId` where-clause:

```ts
    if (filters.crewUserId) where.crewUserIds = { has: filters.crewUserId };
```

- [ ] **Step 2: Accept it on the controller**

Add to `findAll`'s parameters, next to `@Query('assignedToId')`:

```ts
    @Query('crewUserId') crewUserId?: string,
```

and pass it through in the object handed to the service.

- [ ] **Step 3: Build and verify against real data**

```bash
pnpm --filter job-service build
```

Restart job-service, then confirm the filter matches the lead's own jobs (every
job is currently a crew of one, so `crewUserId` and `assignedToId` must return
the same count for the same user):

```bash
H=(-H "x-test-company-id: co-demo-001" -H "x-test-user-id: user-admin-001" -H "x-test-user-role: company_admin")
for f in assignedToId crewUserId; do
  printf "%-14s " "$f"
  curl -s "http://localhost:3002/jobs?$f=user-tech-001&limit=200" "${H[@]}" \
    | node -pe "JSON.parse(require('fs').readFileSync(0)).meta.total"
done
```

Expected: **the two numbers are equal.** They diverge only once a real crew
exists, which is the point.

- [ ] **Step 4: Commit**

```bash
git add apps/job-service/src/jobs/jobs.service.ts apps/job-service/src/jobs/jobs.controller.ts
git commit -m "feat(jobs): filter jobs by crew membership"
```

---

## Task 2: Technician app sees the crew

**Files:**
- Modify: `apps/technician-app/src/hooks/useJobs.ts` (~line 26-29)
- Modify: `apps/technician-app/src/types/api.ts` (Job type)
- Modify: `apps/technician-app/app/job/[id].tsx` (crew strip, lead-only controls)

**Interfaces:**
- Consumes: `crewUserId` from Task 1.
- Produces: `Job.crewUserIds`, `Job.assignedToId` treated as the lead.

- [ ] **Step 1: Query by crew membership**

In `useJobs.ts`, replace the `assignedToId` param with `crewUserId`:

```ts
      if (user?.id) params.set('crewUserId', user.id)
```

and update the `queryKey` to match, so the two never share a cache entry:

```ts
    queryKey: queryKeys.jobs({ ...filters, crewUserId: user?.id }),
```

Leaving `assignedToId` would hide every job where the technician is not the
lead, which is the whole problem this task exists to fix.

- [ ] **Step 2: Add the types**

In `apps/technician-app/src/types/api.ts`, add to the `Job` interface:

```ts
  /** The LEAD. Only they can move the job's status. */
  assignedToId?: string
  /** Every crew member, lead included. */
  crewUserIds?: string[]
  requiredTechCount?: number | null
```

(Only add the fields that are not already present.)

- [ ] **Step 3: Disable job-status controls for non-leads**

In `apps/technician-app/app/job/[id].tsx`, derive:

```tsx
  const isLead = !job?.assignedToId || job.assignedToId === user?.id
  const leadName = job?.assignedToName ?? 'the lead'
```

Wrap the status-transition action so a non-lead sees it **disabled with an
explanation rather than hidden** — a missing button reads as a bug, a disabled
one with a reason reads as a rule:

```tsx
  {!isLead && (
    <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 8 }}>
      {leadName} is leading this job and updates its status. You can still
      complete your own work below.
    </Text>
  )}
```

and pass `disabled={!isLead}` to the status button.

- [ ] **Step 4: Type-check**

```bash
cd apps/technician-app && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/technician-app/src/hooks/useJobs.ts apps/technician-app/src/types/api.ts \
        apps/technician-app/app/job/\[id\].tsx
git commit -m "feat(technician-app): every crew member sees the job, only the lead moves it"
```

---

## Task 3: Crew in the en-route notification

**Files:**
- Modify: `apps/comms-service/src/enroute/dto/enroute-notification.dto.ts`
- Modify: `apps/comms-service/src/enroute/enroute.service.ts`
- Test: `apps/comms-service/src/enroute/enroute.service.spec.ts`

**Interfaces:**
- Produces: optional `crew: CrewMemberDto[]` on the en-route payload, where
  `CrewMemberDto = { userId: string; name: string; isLead: boolean }`.

The field is **optional**: a solo job sends nothing and the email renders exactly
as it does today, so this cannot regress the single-technician path.

- [ ] **Step 1: Write the failing test**

Append to `enroute.service.spec.ts`:

```ts
  it('names the whole crew and marks the lead', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ avatarUrl: 'http://cdn/a.jpg' }),
    });
    await service.notify('co-1', {
      ...baseDto,
      crew: [
        { userId: 'u1', name: 'David Chen', isLead: true },
        { userId: 'u2', name: 'Rachel Kim', isLead: false },
      ],
    } as any);
    const emailArg = (notifications.queueEmail as jest.Mock).mock.calls[0][0];
    expect(emailArg.htmlBody).toContain('David Chen');
    expect(emailArg.htmlBody).toContain('Rachel Kim');
    // The customer needs to know who is in charge, not just who is coming.
    expect(emailArg.htmlBody).toMatch(/lead/i);
  });

  it('renders exactly as before when no crew is supplied', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ avatarUrl: null }),
    });
    await service.notify('co-1', baseDto as any);
    const emailArg = (notifications.queueEmail as jest.Mock).mock.calls[0][0];
    expect(emailArg.htmlBody).toContain(baseDto.techName);
  });
```

Reuse whatever the existing spec calls its fixture and mocks; `baseDto`,
`service` and `notifications` above are placeholders for those existing names —
read the top of the file and match them.

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter comms-service test -- enroute
```

Expected: the crew test fails because `crew` is stripped by `whitelist: true`
and never reaches the template.

- [ ] **Step 3: Add the DTO**

In `enroute-notification.dto.ts`:

```ts
export class CrewMemberDto {
  @IsString() userId!: string;
  @IsString() name!: string;
  @IsBoolean() isLead!: boolean;
}
```

and on the main DTO:

```ts
  /** The full crew. Optional: a solo job omits it and the email is unchanged.
   *  ValidateNested + Type are required or whitelist:true silently drops every
   *  element and the customer is told about nobody. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewMemberDto)
  crew?: CrewMemberDto[];
```

Import `Type` from `class-transformer` and the validators from `class-validator`.

- [ ] **Step 4: Render the crew**

In `enroute.service.ts`, fetch an avatar per member instead of one:

```ts
  /** Avatars for the whole crew, in the order given. Falls back to the single
   *  technician when no crew was supplied, so the solo path is unchanged. */
  private async fetchCrewAvatars(
    companyId: string,
    crew: { userId: string; name: string; isLead: boolean }[],
  ): Promise<{ name: string; isLead: boolean; avatarUrl: string | null }[]> {
    return Promise.all(
      crew.map(async (m) => ({
        name: m.name,
        isLead: m.isLead,
        avatarUrl: await this.fetchTechAvatar(companyId, m.userId),
      })),
    );
  }
```

In `notify`, build the list once and pass it to `buildEmailHtml`:

```ts
    const crew = dto.crew?.length
      ? await this.fetchCrewAvatars(companyId, dto.crew)
      : [{ name: dto.techName, isLead: true, avatarUrl: await this.fetchTechAvatar(companyId, dto.techUserId) }];
```

In `buildEmailHtml`, render each member with their photo (keeping the existing
initials fallback for anyone without one) and mark the lead, for example
`David Chen · leading`. Keep the existing single-technician markup as the
one-member case so nothing about that email changes.

SMS stays lead-only plus a count, because a crew list does not fit a text
message:

```ts
    const others = (dto.crew?.length ?? 1) - 1;
    const who = others > 0 ? `${dto.techName} and ${others} other${others === 1 ? '' : 's'}` : dto.techName;
```

- [ ] **Step 5: Run the tests**

```bash
pnpm --filter comms-service test -- enroute
```

Expected: all pass, including the unchanged-solo-path test.

- [ ] **Step 6: Commit**

```bash
git add apps/comms-service/src/enroute/
git commit -m "feat(comms): name the whole crew in the en-route email"
```

---

## Task 4: Send the crew from scheduling

**Files:**
- Modify: `apps/scheduling-service/internal/service/assignment_service.go`
  (`notifyCustomerEnRoute`, ~line 448)
- Modify: `apps/scheduling-service/internal/repository/crew_repo.go`

**Interfaces:**
- Consumes: `CrewRepository.FindCrew`.
- Produces: the `crew` array on the en-route payload built in Task 3.

- [ ] **Step 1: Give the service a crew repository**

`AssignmentService` does not hold one. Add a field and an optional setter,
matching the existing `WithRosterGate` pattern so wiring stays uniform:

```go
// WithCrew lets the en-route notification name every technician on the job
// rather than only the one who set off.
func (s *AssignmentService) WithCrew(repo *repository.CrewRepository) *AssignmentService {
	s.crewRepo = repo
	return s
}
```

Add `crewRepo *repository.CrewRepository` to the struct, and chain `.WithCrew(crewRepo)`
where the service is constructed in `cmd/server/main.go`.

- [ ] **Step 2: Attach the crew to the payload**

In `notifyCustomerEnRoute`, after the existing payload is built:

```go
	// Tell the customer about everyone who is coming, marking who leads. Best
	// effort: a failure here must not stop the notification, because a late
	// email is worse than one naming a single technician.
	if s.crewRepo != nil {
		if crew, err := s.crewRepo.FindCrew(ctx, companyID, assignment.JobID); err == nil && len(crew) > 0 {
			members := make([]map[string]interface{}, 0, len(crew))
			for _, m := range crew {
				members = append(members, map[string]interface{}{
					"userId": m.Technician.UserID,
					"name":   m.Technician.Name,
					"isLead": m.Assignment.IsLead,
				})
			}
			payload["crew"] = members
		}
	}
```

Check the surrounding function for the name of its context variable and use
that; do not introduce a `context.Background()` here.

- [ ] **Step 3: Build and test**

```bash
cd apps/scheduling-service && go build ./... && go vet ./... && go test ./internal/...
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/scheduling-service/internal/service/assignment_service.go \
        apps/scheduling-service/cmd/server/main.go
git commit -m "feat(scheduling): send the crew with the en-route notification"
```

---

## Task 5: Customer portal shows the crew

**Files:**
- Modify: `apps/customer-portal/src/types/api.ts`
- Modify: `apps/customer-portal/src/pages/jobs/Jobs.tsx`

**Interfaces:**
- Consumes: `Job.crewUserIds`, `Job.assignedToName` (the lead).

- [ ] **Step 1: Add the types**

```ts
  /** The LEAD technician's name, already present as assignedToName. */
  crewUserIds?: string[]
```

- [ ] **Step 2: Show a crew count beside the technician**

Where the job currently shows `assignedToName`, append the rest of the crew:

```tsx
  {job.assignedToName && (
    <span>
      {job.assignedToName}
      {(job.crewUserIds?.length ?? 0) > 1 && (
        <span style={{ color: 'var(--t3)' }}>
          {' '}and {job.crewUserIds!.length - 1} other
          {job.crewUserIds!.length - 1 === 1 ? '' : 's'}
        </span>
      )}
    </span>
  )}
```

Names for the other members are deliberately not fetched here: the portal has
no technician directory endpoint, and adding one to show two extra names on a
list row is not worth a new API surface. The email carries the full names and
photos, which is where a customer actually reads them.

- [ ] **Step 3: Build**

```bash
pnpm --filter customer-portal build
```

Expected: succeeds (`tsc -b && vite build` is the type check).

- [ ] **Step 4: Commit**

```bash
git add apps/customer-portal/src/types/api.ts apps/customer-portal/src/pages/jobs/Jobs.tsx
git commit -m "feat(portal): show how many technicians are coming"
```

---

## Done when

- `crewUserId` and `assignedToId` return the same job count today, and the
  technician app queries the former.
- `npx tsc --noEmit` is clean in technician-app.
- comms-service tests pass, including the test asserting the solo email is
  unchanged.
- Go builds, vets and tests clean.
- customer-portal builds.

## Not in this plan

Lead handover from the technician app (the API exists; the mobile UI for it
does not), per-member check-out from the app, and the customer portal showing
each crew member's photo.
