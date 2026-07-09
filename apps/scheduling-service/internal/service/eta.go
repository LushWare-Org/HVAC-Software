package service

// ETA estimation for en-route customer notifications.
//
// Strategy (best available wins):
//  1. OSRM road-routing drive time from the tech's live GPS to the job site,
//     +15% traffic buffer, rounded into a 20-minute arrival window.
//  2. OSRM unreachable → straight-line (haversine) distance at 30 km/h urban avg.
//  3. No live GPS or no job coords → the assignment's scheduled window.
//  4. Nothing known → nil/nil; the notification sends timeless copy.

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"time"
)

// osrmBaseURL is a variable so tests can point it at an httptest server.
var osrmBaseURL = func() string {
	if u := os.Getenv("OSRM_BASE_URL"); u != "" {
		return u
	}
	return "https://router.project-osrm.org"
}()

const (
	etaTrafficBuffer  = 1.15
	etaWindowMinutes  = 20
	fallbackSpeedKmh  = 30.0
	osrmTimeout       = 5 * time.Second
)

// osrmDriveSeconds asks OSRM for the driving duration between two points.
func osrmDriveSeconds(ctx context.Context, fromLat, fromLng, toLat, toLng float64) (float64, error) {
	ctx, cancel := context.WithTimeout(ctx, osrmTimeout)
	defer cancel()

	url := fmt.Sprintf("%s/route/v1/driving/%f,%f;%f,%f?overview=false",
		osrmBaseURL, fromLng, fromLat, toLng, toLat)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("osrm status %d", resp.StatusCode)
	}

	var body struct {
		Routes []struct {
			Duration float64 `json:"duration"`
		} `json:"routes"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return 0, err
	}
	if len(body.Routes) == 0 {
		return 0, fmt.Errorf("osrm returned no routes")
	}
	return body.Routes[0].Duration, nil
}

func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadiusKm = 6371.0
	toRad := func(d float64) float64 { return d * math.Pi / 180 }
	dLat := toRad(lat2 - lat1)
	dLng := toRad(lng2 - lng1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*math.Sin(dLng/2)*math.Sin(dLng/2)
	return earthRadiusKm * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

// estimateETAWindow computes the arrival window for an en-route technician.
// Either return value may be nil; both nil means "no time known".
func estimateETAWindow(
	ctx context.Context,
	techLoc *struct{ Lat, Lng float64 },
	jobLat, jobLng *float64,
	scheduledStart, scheduledEnd *time.Time,
	now time.Time,
) (*time.Time, *time.Time) {
	if techLoc != nil && jobLat != nil && jobLng != nil {
		driveSecs, err := osrmDriveSeconds(ctx, techLoc.Lat, techLoc.Lng, *jobLat, *jobLng)
		if err != nil {
			// OSRM down — straight-line estimate at urban average speed.
			km := haversineKm(techLoc.Lat, techLoc.Lng, *jobLat, *jobLng)
			driveSecs = km / fallbackSpeedKmh * 3600
		}
		arrival := now.Add(time.Duration(driveSecs*etaTrafficBuffer) * time.Second)
		// Round down to a 10-min mark so the window reads naturally (2:40–3:00),
		// but never promise a start earlier than now.
		start := arrival.Truncate(10 * time.Minute)
		if start.Before(now) {
			start = now.Truncate(time.Minute)
		}
		end := start.Add(etaWindowMinutes * time.Minute)
		return &start, &end
	}

	// No live position — fall back to what was promised when scheduling.
	if scheduledStart != nil {
		end := scheduledEnd
		if end == nil {
			e := scheduledStart.Add(time.Hour)
			end = &e
		}
		return scheduledStart, end
	}
	return nil, nil
}
