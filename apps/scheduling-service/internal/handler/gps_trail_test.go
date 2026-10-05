package handler

import (
	"testing"
	"time"
)

func TestTrailSince(t *testing.T) {
	now := time.Date(2026, 10, 5, 12, 0, 0, 0, time.UTC)
	cases := []struct {
		name, since, minutes string
		want                 time.Time
	}{
		{"uses the trip start", "2026-10-05T11:20:00Z", "120", now.Add(-40 * time.Minute)},
		{"accepts fractional seconds", "2026-10-05T11:20:00.5Z", "", time.Date(2026, 10, 5, 11, 20, 0, 5e8, time.UTC)},
		{"ignores a future since", "2026-10-05T13:00:00Z", "30", now.Add(-30 * time.Minute)},
		{"ignores a since older than a day", "2026-10-03T12:00:00Z", "30", now.Add(-30 * time.Minute)},
		{"ignores a malformed since", "yesterday", "30", now.Add(-30 * time.Minute)},
		{"defaults to two hours", "", "", now.Add(-120 * time.Minute)},
		{"clamps a huge window", "", "99999", now.Add(-120 * time.Minute)},
	}
	for _, c := range cases {
		if got := trailSince(now, c.since, c.minutes); !got.Equal(c.want) {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
}
