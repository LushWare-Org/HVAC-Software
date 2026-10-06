package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

type fakeShifts struct{ setErr error }

func (f *fakeShifts) ShiftOverrides(context.Context, string, string, string) ([]repository.ShiftRow, error) {
	return []repository.ShiftRow{}, nil
}
func (f *fakeShifts) SetShift(context.Context, string, string, string, bool, string, string, *string) error {
	return f.setErr
}
func (f *fakeShifts) ClearShift(context.Context, string, string, string) error { return nil }

type fakeHub struct{ sent []models.WSMessage }

func (h *fakeHub) BroadcastMessage(_ context.Context, m models.WSMessage) { h.sent = append(h.sent, m) }

func availabilityRouter(h *AvailabilityHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) { c.Set(middleware.ClaimsKey, middleware.AuthClaims{CompanyID: "co"}); c.Next() })
	r.PUT("/availability/:technicianId/:date", h.Set)
	r.DELETE("/availability/:technicianId/:date", h.Clear)
	return r
}

func TestAvailabilityChangesAreAnnounced(t *testing.T) {
	hub := &fakeHub{}
	r := availabilityRouter(NewAvailabilityHandler(&fakeShifts{}, hub))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/availability/t1/2026-10-07", strings.NewReader(`{"available":false}`)))
	if w.Code != http.StatusOK {
		t.Fatalf("set: %d %s", w.Code, w.Body.String())
	}
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/availability/t1/2026-10-07", nil))
	if w.Code != http.StatusNoContent {
		t.Fatalf("clear: %d", w.Code)
	}
	if len(hub.sent) != 2 || hub.sent[0].Type != models.WSTypeAvailabilityChanged || hub.sent[0].CompanyID != "co" {
		t.Fatalf("want two AVAILABILITY_CHANGED for co, got %+v", hub.sent)
	}
	p := hub.sent[1].Payload.(gin.H)
	if p["technicianId"] != "t1" || p["date"] != "2026-10-07" {
		t.Fatalf("payload: %+v", p)
	}
}

func TestFailedChangeIsNotAnnounced(t *testing.T) {
	hub := &fakeHub{}
	r := availabilityRouter(NewAvailabilityHandler(&fakeShifts{setErr: repository.ErrTechnicianNotFound}, hub))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/availability/t1/2026-10-07", strings.NewReader(`{"available":false}`)))
	if w.Code != http.StatusNotFound || len(hub.sent) != 0 {
		t.Fatalf("want 404 and nothing sent, got %d %+v", w.Code, hub.sent)
	}
}
