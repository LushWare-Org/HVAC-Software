package repository_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
)

// Runs the slot queries against a real Postgres with the crm, jobs and
// scheduling schemas loaded. Skipped unless SLOTS_TEST_DATABASE_URL points at a
// throwaway database; it inserts and deletes its own rows under one company id.
func TestSlotRepositoryAgainstRealSchema(t *testing.T) {
	url := os.Getenv("SLOTS_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set SLOTS_TEST_DATABASE_URL to a throwaway database to run")
	}
	ctx := context.Background()
	db, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	const co = "co-slots-it"
	exec := func(sql string, args ...any) {
		t.Helper()
		if _, err := db.Exec(ctx, sql, args...); err != nil {
			t.Fatalf("%v\n%s", err, sql)
		}
	}
	cleanup := func() {
		db.Exec(ctx, `DELETE FROM scheduling.technician_shifts WHERE company_id = $1`, co)
		db.Exec(ctx, `DELETE FROM jobs.job_crew_events WHERE "companyId" = $1`, co)
		db.Exec(ctx, `DELETE FROM scheduling.dispatch_assignments WHERE company_id = $1`, co)
		db.Exec(ctx, `DELETE FROM scheduling.technicians WHERE company_id = $1`, co)
		db.Exec(ctx, `DELETE FROM jobs.jobs WHERE "companyId" = $1`, co)
		db.Exec(ctx, `DELETE FROM crm.companies WHERE id = $1`, co)
	}
	cleanup()
	defer cleanup()

	dubai, _ := time.LoadLocation("Asia/Dubai")
	tomorrow := time.Now().In(dubai).AddDate(0, 0, 1)
	local := func(h, m int) time.Time {
		return time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), h, m, 0, 0, dubai)
	}

	exec(`INSERT INTO crm.companies (id, name, email, "updatedAt", timezone) VALUES ($1, 'Slots Co', 's@s.s', now(), 'Asia/Dubai')`, co)
	var kasun, nuwan, retired string
	db.QueryRow(ctx, `INSERT INTO scheduling.technicians (company_id, user_id, name, skills, max_daily_jobs, base_location)
		VALUES ($1, 'u-kasun', 'Kasun', ARRAY['AC'], 8, ST_SetSRID(ST_MakePoint(55.14, 25.08), 4326)) RETURNING id`, co).Scan(&kasun)
	db.QueryRow(ctx, `INSERT INTO scheduling.technicians (company_id, user_id, name, skills, max_daily_jobs)
		VALUES ($1, 'u-nuwan', 'Nuwan', ARRAY['Plumbing'], 1) RETURNING id`, co).Scan(&nuwan)
	db.QueryRow(ctx, `INSERT INTO scheduling.technicians (company_id, user_id, name, is_active)
		VALUES ($1, 'u-old', 'Retired', FALSE) RETURNING id`, co).Scan(&retired)

	job := func(id, status string, lat, lng float64) {
		exec(`INSERT INTO jobs.jobs (id, "companyId", "jobNumber", "customerId", "customerName", "serviceAddress", title, "createdByUserId", "updatedAt", status, "serviceLatitude", "serviceLongitude")
			VALUES ($1, $2, $1, 'c', 'Cust', 'Dubai', 'Visit', 'u', now(), $3, $4, $5)`, id, co, status, lat, lng)
	}
	assign := func(jobID, tech, status string, start, end time.Time) {
		exec(`INSERT INTO scheduling.dispatch_assignments (company_id, job_id, technician_id, status, scheduled_start, scheduled_end)
			VALUES ($1, $2, $3, $4, $5, $6)`, co, jobID, tech, status, start, end)
	}
	job("SL-1", "SCHEDULED", 25.30, 55.45)
	assign("SL-1", kasun, "ASSIGNED", local(9, 0), local(11, 0)) // live: blocks Kasun 09:00-11:00 across town
	job("SL-2", "CANCELLED", 25.08, 55.14)
	assign("SL-2", kasun, "ASSIGNED", local(13, 0), local(14, 0)) // job cancelled: must not block
	job("SL-3", "SCHEDULED", 25.08, 55.14)
	assign("SL-3", kasun, "CANCELLED", local(15, 0), local(16, 0)) // assignment cancelled: must not block
	job("SL-4", "SCHEDULED", 25.08, 55.14)
	assign("SL-4", nuwan, "ASSIGNED", local(10, 0), local(11, 0)) // Nuwan's one job: he is full

	repo := repository.NewSlotRepository(db)
	if tz, err := repo.CompanyTimezone(ctx, co); err != nil || tz != "Asia/Dubai" {
		t.Fatalf("timezone: %q %v", tz, err)
	}
	techs, err := repo.ActiveTechnicians(ctx, co)
	if err != nil || len(techs) != 2 {
		t.Fatalf("want 2 active technicians, got %d (%v)", len(techs), err)
	}
	if techs[0].Name != "Kasun" || techs[0].Start == nil || techs[0].Start.Lat != 25.08 || techs[0].Skills[0] != "AC" {
		t.Errorf("Kasun's base and skills not read: %+v", techs[0])
	}
	bookings, err := repo.Bookings(ctx, co, local(0, 0), local(23, 59))
	if err != nil || len(bookings) != 2 {
		t.Fatalf("want 2 live bookings (cancelled ones excluded), got %d (%v)", len(bookings), err)
	}

	svc := service.NewSlotService(repo)
	lat, lng := 25.08, 55.14
	res, err := svc.Find(ctx, co, service.SlotQuery{From: tomorrow.Format("2006-01-02"), Days: 1, DurationMins: 60, Lat: &lat, Lng: &lng})
	if err != nil {
		t.Fatal(err)
	}
	var times []string
	for _, s := range res.Slots {
		if s.TechName == "Nuwan" {
			t.Errorf("Nuwan is at his daily limit but was offered %s", s.Start.In(dubai).Format("15:04"))
		}
		times = append(times, s.Start.In(dubai).Format("15:04"))
	}
	// Kasun is free 08:00 (must be back across town by 09:00: no, 08:00-09:00 plus a long drive fails),
	// and after 11:00 plus the drive back from 25.30,55.45. The cancelled 13:00 and 15:00 bookings are open.
	if len(times) == 0 {
		t.Fatal("expected open times for Kasun")
	}
	for _, s := range res.Slots {
		if s.Start.Before(local(11, 0)) && s.End.After(local(9, 0)) {
			t.Errorf("offered %s inside Kasun's 09:00-11:00 booking", s.Start.In(dubai).Format("15:04"))
		}
	}
	t.Logf("Kasun's open times tomorrow: %v", times)

	// Today's visits carry job details and the job's own status.
	visits, err := repo.TodayVisits(ctx, co, local(0, 0), local(23, 59))
	if err != nil {
		t.Fatal(err)
	}
	if len(visits) != 2 {
		t.Fatalf("want 2 live visits (cancelled job and assignment excluded), got %d", len(visits))
	}
	for _, v := range visits {
		if v.JobNumber == "" || v.TechName == "" || v.Status != "SCHEDULED" {
			t.Errorf("visit missing details: %+v", v)
		}
	}

	// Live positions: only fresh fixes count.
	exec(`UPDATE scheduling.technicians SET current_location = ST_SetSRID(ST_MakePoint(55.2, 25.1), 4326), last_seen_at = now() WHERE id = $1`, kasun)
	exec(`UPDATE scheduling.technicians SET current_location = ST_SetSRID(ST_MakePoint(55.3, 25.2), 4326), last_seen_at = now() - interval '3 hours' WHERE id = $1`, nuwan)
	pos, err := repo.LivePositions(ctx, co, time.Now().Add(-30*time.Minute))
	if err != nil || len(pos) != 1 || pos[kasun] == nil || pos[kasun].Lat != 25.1 {
		t.Fatalf("want only Kasun's fresh position, got %v (%v)", pos, err)
	}

	// Changing the crew gives the new technician the job's time, so they stop looking free.
	// Written the way Prisma writes them: UTC wall-clock in a zone-less column.
	utcWall := func(t time.Time) string { return t.UTC().Format("2006-01-02 15:04:05") }
	exec(`UPDATE jobs.jobs SET "scheduledStart" = $1::timestamp, "scheduledEnd" = $2::timestamp WHERE id = 'SL-4'`, utcWall(local(10, 0)), utcWall(local(11, 0)))
	crew := repository.NewCrewRepository(db)
	if err := crew.SetCrew(ctx, co, "SL-4", "u-admin", "Admin", models.CrewInput{TechnicianIDs: []string{kasun}, LeadTechnicianID: kasun}); err != nil {
		t.Fatalf("set crew: %v", err)
	}
	var start, end *time.Time
	if err := db.QueryRow(ctx, `SELECT scheduled_start, scheduled_end FROM scheduling.dispatch_assignments
		WHERE job_id = 'SL-4' AND technician_id = $1 AND status <> 'CANCELLED'`, kasun).Scan(&start, &end); err != nil {
		t.Fatal(err)
	}
	if start == nil || end == nil || !start.Equal(local(10, 0)) || !end.Equal(local(11, 0)) {
		t.Fatalf("the new crew row should take the job's 10:00-11:00, got %v-%v", start, end)
	}

	// Days off: Kasun off tomorrow means no open times for him tomorrow.
	day := tomorrow.Format("2006-01-02")
	note := "Sick"
	if err := repo.SetShift(ctx, co, kasun, day, false, "08:00", "17:00", &note); err != nil {
		t.Fatalf("set shift: %v", err)
	}
	if err := repo.SetShift(ctx, "another-company", kasun, day, false, "08:00", "17:00", nil); err != repository.ErrTechnicianNotFound {
		t.Fatalf("another company must not change Kasun's day, got %v", err)
	}
	rows, err := repo.ShiftOverrides(ctx, co, day, day)
	if err != nil || len(rows) != 1 || rows[0].Available || rows[0].TechnicianName != "Kasun" || rows[0].Note == nil || *rows[0].Note != "Sick" {
		t.Fatalf("want Kasun off with the note, got %+v (%v)", rows, err)
	}
	offRes, err := svc.Find(ctx, co, service.SlotQuery{From: day, Days: 1, DurationMins: 60})
	if err != nil {
		t.Fatal(err)
	}
	for _, s := range offRes.Slots {
		if s.TechName == "Kasun" {
			t.Errorf("Kasun is off but was offered %s", s.Start.In(dubai).Format("15:04"))
		}
	}
	if err := repo.ClearShift(ctx, co, kasun, day); err != nil {
		t.Fatal(err)
	}
	if rows, _ := repo.ShiftOverrides(ctx, co, day, day); len(rows) != 0 {
		t.Errorf("clearing should remove the entry, got %+v", rows)
	}
}
