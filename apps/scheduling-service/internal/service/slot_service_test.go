package service

import (
	"context"
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/slots"
)

type fakeSlotSource struct {
	tz       string
	techs    []slots.Tech
	bookings []slots.Booking
	shifts   []repository.ShiftRow
	from, to time.Time
}

func (f *fakeSlotSource) ShiftOverrides(context.Context, string, string, string) ([]repository.ShiftRow, error) {
	return f.shifts, nil
}

func (f *fakeSlotSource) CompanyTimezone(context.Context, string) (string, error) { return f.tz, nil }
func (f *fakeSlotSource) ActiveTechnicians(context.Context, string) ([]slots.Tech, error) {
	return f.techs, nil
}
func (f *fakeSlotSource) Bookings(_ context.Context, _ string, from, to time.Time) ([]slots.Booking, error) {
	f.from, f.to = from, to
	return f.bookings, nil
}

func TestSlotServiceUsesCompanyTimeAndNotice(t *testing.T) {
	src := &fakeSlotSource{tz: "Asia/Dubai", techs: []slots.Tech{{ID: "k", Name: "Kasun"}}}
	svc := NewSlotService(src)
	// 07:30 UTC on 6 Oct is 11:30 in Dubai: today's first offer is 12:30 at the earliest.
	svc.now = func() time.Time { return time.Date(2026, 10, 6, 7, 30, 0, 0, time.UTC) }

	res, err := svc.Find(context.Background(), "co", SlotQuery{Days: 2})
	if err != nil {
		t.Fatal(err)
	}
	if res.From != "2026-10-06" || res.Timezone != "Asia/Dubai" || res.DurationMins != DefaultSlotDurationMins {
		t.Fatalf("unexpected header %+v", res)
	}
	dubai, _ := time.LoadLocation("Asia/Dubai")
	if got := res.Slots[0].Start.In(dubai).Format("2006-01-02 15:04"); got != "2026-10-06 12:30" {
		t.Errorf("first offer today should respect one hour notice, got %s", got)
	}
	if got := res.Slots[1].Start.In(dubai).Format("2006-01-02 15:04"); got != "2026-10-07 08:00" {
		t.Errorf("next day should open at 08:00, got %s", got)
	}
	if !src.from.Equal(time.Date(2026, 10, 6, 4, 0, 0, 0, time.UTC)) || !src.to.Equal(time.Date(2026, 10, 7, 13, 0, 0, 0, time.UTC)) {
		t.Errorf("bookings read for the wrong window: %s to %s", src.from, src.to)
	}
}

func TestSlotServiceClampsAndFallsBack(t *testing.T) {
	src := &fakeSlotSource{tz: "Not/AZone", techs: []slots.Tech{{ID: "k"}}}
	svc := NewSlotService(src)
	svc.now = func() time.Time { return time.Date(2026, 10, 6, 0, 0, 0, 0, time.UTC) }

	res, err := svc.Find(context.Background(), "co", SlotQuery{Days: 99, DurationMins: 5})
	if err != nil {
		t.Fatal(err)
	}
	if res.Timezone != "UTC" || res.Days != maxSlotDays || res.DurationMins != 15 {
		t.Errorf("want UTC, %d days, 15 min; got %+v", maxSlotDays, res)
	}

	none, err := svc.Find(context.Background(), "co", SlotQuery{From: "2026-10-08", Days: 1, DurationMins: 12 * 60})
	if err != nil {
		t.Fatal(err)
	}
	if none.DurationMins != 600 || len(none.Slots) != 0 || none.Slots == nil {
		t.Errorf("a 10 hour visit fits no 9 hour day; want an empty list, got %+v", none)
	}

	if _, err := svc.Find(context.Background(), "co", SlotQuery{From: "next week"}); err == nil {
		t.Error("a malformed date should be an error")
	}
}
