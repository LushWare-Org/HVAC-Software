package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func f64(v float64) *float64 { return &v }

func TestEstimateETAWindow_OSRM(t *testing.T) {
	// OSRM stub: 600 s (10 min) drive.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"routes":[{"duration":600}]}`))
	}))
	defer srv.Close()
	oldBase := osrmBaseURL
	osrmBaseURL = srv.URL
	defer func() { osrmBaseURL = oldBase }()

	now := time.Date(2026, 7, 3, 14, 23, 0, 0, time.UTC)
	loc := &struct{ Lat, Lng float64 }{30.27, -97.74}
	start, end := estimateETAWindow(context.Background(), loc, f64(30.30), f64(-97.70), nil, nil, now)

	if start == nil || end == nil {
		t.Fatal("expected a window, got nil")
	}
	// 600 s * 1.15 = 11.5 min → arrival 14:34:30 → start truncates to 14:30.
	if got := start.Format("15:04"); got != "14:30" {
		t.Errorf("start = %s, want 14:30", got)
	}
	if got := end.Sub(*start); got != 20*time.Minute {
		t.Errorf("window length = %v, want 20m", got)
	}
}

func TestEstimateETAWindow_OSRMDown_FallsBackToHaversine(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()
	oldBase := osrmBaseURL
	osrmBaseURL = srv.URL
	defer func() { osrmBaseURL = oldBase }()

	now := time.Date(2026, 7, 3, 14, 0, 0, 0, time.UTC)
	loc := &struct{ Lat, Lng float64 }{30.27, -97.74}
	start, end := estimateETAWindow(context.Background(), loc, f64(30.36), f64(-97.74), nil, nil, now)

	if start == nil || end == nil {
		t.Fatal("expected a fallback window, got nil")
	}
	// ~10 km at 30 km/h ≈ 20 min * 1.15 → arrival ≈ 14:23 → start 14:20.
	if start.Before(now) || start.After(now.Add(time.Hour)) {
		t.Errorf("fallback start %v not within the expected hour after now", start)
	}
}

func TestEstimateETAWindow_NoGPS_UsesScheduledWindow(t *testing.T) {
	schedStart := time.Date(2026, 7, 3, 16, 0, 0, 0, time.UTC)
	schedEnd := schedStart.Add(90 * time.Minute)
	start, end := estimateETAWindow(context.Background(), nil, f64(30.3), f64(-97.7), &schedStart, &schedEnd, time.Now())

	if start == nil || end == nil || !start.Equal(schedStart) || !end.Equal(schedEnd) {
		t.Errorf("expected scheduled window passthrough, got %v–%v", start, end)
	}
}

func TestEstimateETAWindow_NoGPSNoSchedule_ReturnsNil(t *testing.T) {
	start, end := estimateETAWindow(context.Background(), nil, nil, nil, nil, nil, time.Now())
	if start != nil || end != nil {
		t.Errorf("expected nil/nil, got %v–%v", start, end)
	}
}

func TestEstimateETAWindow_StartNeverBeforeNow(t *testing.T) {
	// 0-second drive → arrival == now; truncation must not promise the past.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"routes":[{"duration":0}]}`))
	}))
	defer srv.Close()
	oldBase := osrmBaseURL
	osrmBaseURL = srv.URL
	defer func() { osrmBaseURL = oldBase }()

	now := time.Date(2026, 7, 3, 14, 29, 45, 0, time.UTC)
	loc := &struct{ Lat, Lng float64 }{30.27, -97.74}
	start, _ := estimateETAWindow(context.Background(), loc, f64(30.27), f64(-97.74), nil, nil, now)
	if start == nil || start.Before(now.Truncate(time.Minute)) {
		t.Errorf("start %v is before now %v", start, now)
	}
}

func TestHaversineKm(t *testing.T) {
	// Austin downtown → airport ≈ 12 km straight-line.
	km := haversineKm(30.2672, -97.7431, 30.1945, -97.6699)
	if km < 10 || km > 13 {
		t.Errorf("haversine = %.1f km, want ~10-13", km)
	}
}
