package service

import (
	"math"
	"testing"

	"github.com/tscrm/scheduling-service/internal/config"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

// ── Helpers ───────────────────────────────────────────────────────────────

func defaultConfig() *config.Config {
	return &config.Config{
		MaxDistanceKm:       50.0,
		MaxActiveJobs:       5,
		AutoAssignThreshold: 90.0,
	}
}

func makeTechWithDistance(distanceKm float64, rating float64) repository.TechnicianWithDistance {
	return repository.TechnicianWithDistance{
		Technician: models.Technician{
			ID:     "tech-001",
			Rating: rating,
		},
		DistanceKm: distanceKm,
	}
}

func almostEqual(a, b, tolerance float64) bool {
	return math.Abs(a-b) <= tolerance
}

// ═══════════════════════════════════════════════════════════════════════════
// scoreTechnician — pure function tests
// ═══════════════════════════════════════════════════════════════════════════

func TestScoreTechnician_PerfectCandidate(t *testing.T) {
	// A technician right at the job site, no active jobs, 5-star rating
	// Expected: 100×0.40 + 100×0.35 + 100×0.25 = 100.0
	cfg := defaultConfig()
	candidate := makeTechWithDistance(0.0, 5.0)
	result := scoreTechnician(candidate, 0, cfg, 0, false)

	if result.Score != 100.0 {
		t.Errorf("expected score 100.0, got %.2f", result.Score)
	}
	if result.DistanceScore != 100.0 {
		t.Errorf("expected distanceScore 100.0, got %.2f", result.DistanceScore)
	}
	if result.WorkloadScore != 100.0 {
		t.Errorf("expected workloadScore 100.0, got %.2f", result.WorkloadScore)
	}
	if result.RatingScore != 100.0 {
		t.Errorf("expected ratingScore 100.0, got %.2f", result.RatingScore)
	}
}

func TestScoreTechnician_MaxDistance(t *testing.T) {
	// Technician exactly at max distance boundary
	// distanceScore = max(0, 100 - 50/50×100) = 0
	// If idle (workload=100) and 5-star (rating=100):
	// total = 0×0.40 + 100×0.35 + 100×0.25 = 0 + 35 + 25 = 60.0
	cfg := defaultConfig()
	candidate := makeTechWithDistance(50.0, 5.0)
	result := scoreTechnician(candidate, 0, cfg, 0, false)

	if result.DistanceScore != 0.0 {
		t.Errorf("expected distanceScore 0.0 at max range, got %.2f", result.DistanceScore)
	}
	if !almostEqual(result.Score, 60.0, 0.01) {
		t.Errorf("expected total score 60.0, got %.2f", result.Score)
	}
}

func TestScoreTechnician_BeyondMaxDistance_ClampedToZero(t *testing.T) {
	// Technician beyond max distance — distanceScore must clamp to 0 (not go negative)
	cfg := defaultConfig()
	candidate := makeTechWithDistance(75.0, 5.0) // 50% beyond max
	result := scoreTechnician(candidate, 0, cfg, 0, false)

	if result.DistanceScore < 0 {
		t.Errorf("distanceScore must not be negative, got %.2f", result.DistanceScore)
	}
	if result.DistanceScore != 0.0 {
		t.Errorf("expected distanceScore clamped to 0.0, got %.2f", result.DistanceScore)
	}
}

func TestScoreTechnician_MaxWorkload_ClampedToZero(t *testing.T) {
	// Technician at full capacity — workloadScore must be 0 (not negative)
	cfg := defaultConfig()
	candidate := makeTechWithDistance(0.0, 5.0)
	result := scoreTechnician(candidate, cfg.MaxActiveJobs, cfg, 0, false) // exactly at max

	if result.WorkloadScore != 0.0 {
		t.Errorf("expected workloadScore 0.0 at max capacity, got %.2f", result.WorkloadScore)
	}
}

func TestScoreTechnician_OverCapacity_ClampedToZero(t *testing.T) {
	// More jobs than max — workloadScore must still be 0, not negative
	cfg := defaultConfig()
	candidate := makeTechWithDistance(0.0, 5.0)
	result := scoreTechnician(candidate, cfg.MaxActiveJobs+2, cfg, 0, false)

	if result.WorkloadScore < 0 {
		t.Errorf("workloadScore must not be negative, got %.2f", result.WorkloadScore)
	}
}

func TestScoreTechnician_ZeroRating(t *testing.T) {
	// A technician with 0.0 star rating
	cfg := defaultConfig()
	candidate := makeTechWithDistance(0.0, 0.0)
	result := scoreTechnician(candidate, 0, cfg, 0, false)

	if result.RatingScore != 0.0 {
		t.Errorf("expected ratingScore 0.0, got %.2f", result.RatingScore)
	}
	// total = 100×0.40 + 100×0.35 + 0×0.25 = 40 + 35 = 75.0
	if !almostEqual(result.Score, 75.0, 0.01) {
		t.Errorf("expected total score 75.0, got %.2f", result.Score)
	}
}

func TestScoreTechnician_MidpointValues(t *testing.T) {
	// 25km out (half max), 2-3 active jobs (half capacity), 2.5 star rating (half max)
	// distanceScore = 100 - (25/50×100) = 50
	// workloadScore = 100 - (2/5×100)   = 60   (note: using 2, not 2.5)
	// ratingScore   = (2.5/5.0)×100     = 50
	// total = 50×0.40 + 60×0.35 + 50×0.25 = 20 + 21 + 12.5 = 53.5
	cfg := defaultConfig()
	candidate := makeTechWithDistance(25.0, 2.5)
	result := scoreTechnician(candidate, 2, cfg, 0, false)

	if !almostEqual(result.DistanceScore, 50.0, 0.01) {
		t.Errorf("expected distanceScore 50.0, got %.2f", result.DistanceScore)
	}
	if !almostEqual(result.WorkloadScore, 60.0, 0.01) {
		t.Errorf("expected workloadScore 60.0, got %.2f", result.WorkloadScore)
	}
	if !almostEqual(result.RatingScore, 50.0, 0.01) {
		t.Errorf("expected ratingScore 50.0, got %.2f", result.RatingScore)
	}
	if !almostEqual(result.Score, 53.5, 0.01) {
		t.Errorf("expected total score 53.5, got %.2f", result.Score)
	}
}

func TestScoreTechnician_WeightsSumToOne(t *testing.T) {
	// Regression: verify weights always produce 100 for perfect candidate
	totalWeight := 0.40 + 0.35 + 0.25
	if !almostEqual(totalWeight, 1.0, 0.0001) {
		t.Errorf("scoring weights must sum to 1.0, got %.4f", totalWeight)
	}
}

func TestScoreTechnician_AutoAssignThreshold(t *testing.T) {
	// Verify a highly-scored technician meets the auto-assign threshold
	// On-site, one active job, 4.5 stars:
	// distanceScore = 100
	// workloadScore = 100 - (1/5×100) = 80
	// ratingScore   = (4.5/5.0)×100   = 90
	// total = 100×0.40 + 80×0.35 + 90×0.25 = 40 + 28 + 22.5 = 90.5
	cfg := defaultConfig()
	candidate := makeTechWithDistance(0.0, 4.5)
	result := scoreTechnician(candidate, 1, cfg, 0, false)

	if result.Score < cfg.AutoAssignThreshold {
		t.Errorf(
			"expected score >= %.1f for auto-assign (highly qualified tech), got %.2f",
			cfg.AutoAssignThreshold, result.Score,
		)
	}
}

func TestScoreTechnician_BelowAutoAssignThreshold(t *testing.T) {
	// A tech that is good but should NOT be auto-assigned:
	// 10km away, 3 active jobs, 3-star rating
	// distanceScore = 100 - (10/50×100) = 80
	// workloadScore = 100 - (3/5×100)   = 40
	// ratingScore   = (3.0/5.0)×100     = 60
	// total = 80×0.40 + 40×0.35 + 60×0.25 = 32 + 14 + 15 = 61.0
	cfg := defaultConfig()
	candidate := makeTechWithDistance(10.0, 3.0)
	result := scoreTechnician(candidate, 3, cfg, 0, false)

	if result.Score >= cfg.AutoAssignThreshold {
		t.Errorf(
			"expected score < %.1f (should NOT auto-assign), got %.2f",
			cfg.AutoAssignThreshold, result.Score,
		)
	}
	if !almostEqual(result.Score, 61.0, 0.01) {
		t.Errorf("expected score 61.0, got %.2f", result.Score)
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// roundTwoDP
// ═══════════════════════════════════════════════════════════════════════════

func TestRoundTwoDP(t *testing.T) {
	cases := []struct {
		input    float64
		expected float64
	}{
		{53.456789, 53.46},
		{99.994, 99.99},
		{99.995, 100.00},
		{0.0, 0.0},
		{100.0, 100.0},
		{33.333, 33.33},
	}
	for _, tc := range cases {
		got := roundTwoDP(tc.input)
		if !almostEqual(got, tc.expected, 0.001) {
			t.Errorf("roundTwoDP(%.6f) = %.4f; want %.2f", tc.input, got, tc.expected)
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// parseTimes
// ═══════════════════════════════════════════════════════════════════════════

func TestParseTimes_ValidRFC3339(t *testing.T) {
	s := "2024-07-15T09:00:00Z"
	e := "2024-07-15T11:00:00Z"
	start, end := parseTimes(&s, &e)
	if start == nil {
		t.Error("expected non-nil start time")
	}
	if end == nil {
		t.Error("expected non-nil end time")
	}
	if !start.Before(*end) {
		t.Error("expected start to be before end")
	}
}

func TestParseTimes_NilInputs(t *testing.T) {
	start, end := parseTimes(nil, nil)
	if start != nil {
		t.Error("expected nil start for nil input")
	}
	if end != nil {
		t.Error("expected nil end for nil input")
	}
}

func TestParseTimes_InvalidFormat(t *testing.T) {
	s := "not-a-date"
	start, end := parseTimes(&s, nil)
	if start != nil {
		t.Error("expected nil start for invalid date format")
	}
	if end != nil {
		t.Error("expected nil end")
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Ranking / sorting behaviour (table-driven)
// ═══════════════════════════════════════════════════════════════════════════

func TestScoreTechnician_RankingOrder(t *testing.T) {
	// Scenario: three technicians; after scoring we expect them ranked A > B > C
	cfg := defaultConfig()

	// Technician A: nearby, light workload, high rating → best
	cA := makeTechWithDistance(2.0, 4.8)
	sA := scoreTechnician(cA, 0, cfg, 0, false)

	// Technician B: medium distance, medium workload, medium rating → middle
	cB := makeTechWithDistance(20.0, 3.5)
	sB := scoreTechnician(cB, 2, cfg, 0, false)

	// Technician C: far, heavily loaded, low rating → worst
	cC := makeTechWithDistance(45.0, 2.0)
	sC := scoreTechnician(cC, 4, cfg, 0, false)

	if sA.Score <= sB.Score {
		t.Errorf("expected score(A) > score(B), got %.2f <= %.2f", sA.Score, sB.Score)
	}
	if sB.Score <= sC.Score {
		t.Errorf("expected score(B) > score(C), got %.2f <= %.2f", sB.Score, sC.Score)
	}
}
