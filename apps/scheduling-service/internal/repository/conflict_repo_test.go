package repository

import (
	"testing"
	"time"
)

func at(h, m int) time.Time {
	return time.Date(2026, 9, 9, h, m, 0, 0, time.UTC)
}

func TestOverlaps(t *testing.T) {
	cases := []struct {
		name                       string
		aStart, aEnd, bStart, bEnd time.Time
		want                       bool
	}{
		{"identical", at(9, 0), at(12, 0), at(9, 0), at(12, 0), true},
		{"b inside a", at(9, 0), at(12, 0), at(10, 0), at(11, 0), true},
		{"a inside b", at(10, 0), at(11, 0), at(9, 0), at(12, 0), true},
		{"partial overlap at start", at(9, 0), at(12, 0), at(8, 0), at(10, 0), true},
		{"partial overlap at end", at(9, 0), at(12, 0), at(11, 0), at(13, 0), true},

		// Back-to-back jobs are the normal shape of a day's route. Treating them
		// as conflicts would flag nearly every technician and make the warning
		// meaningless.
		{"b ends exactly when a starts", at(9, 0), at(12, 0), at(7, 0), at(9, 0), false},
		{"b starts exactly when a ends", at(9, 0), at(12, 0), at(12, 0), at(14, 0), false},

		{"entirely before", at(9, 0), at(12, 0), at(6, 0), at(7, 0), false},
		{"entirely after", at(9, 0), at(12, 0), at(15, 0), at(16, 0), false},
	}
	for _, c := range cases {
		if got := Overlaps(c.aStart, c.aEnd, c.bStart, c.bEnd); got != c.want {
			t.Fatalf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}

func TestHaversineKm_ColomboDistances(t *testing.T) {
	// Colombo Fort to Dehiwala is about 10 km along the coast.
	d := haversineKm(6.9344, 79.8428, 6.8567, 79.8684)
	if d < 8 || d > 12 {
		t.Fatalf("expected roughly 10 km, got %.2f", d)
	}
	if got := haversineKm(6.9344, 79.8428, 6.9344, 79.8428); got != 0 {
		t.Fatalf("distance to itself must be 0, got %v", got)
	}
}
