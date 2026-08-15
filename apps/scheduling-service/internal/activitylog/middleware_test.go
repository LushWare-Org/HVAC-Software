package activitylog

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
)

func TestMiddleware_PostsEventAfterHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	received := make(chan map[string]interface{}, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		_ = json.NewDecoder(r.Body).Decode(&body)
		received <- body
		w.WriteHeader(http.StatusAccepted)
	}))
	defer upstream.Close()

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ClaimsKey, middleware.AuthClaims{
			UserID: "u1", CompanyID: "co-1", Role: "dispatcher", Name: "Jane",
		})
		c.Next()
	})
	r.Use(Middleware(upstream.URL))
	r.POST("/dispatch/assign", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"jobId": "j1"})
	})

	req := httptest.NewRequest(http.MethodPost, "/dispatch/assign", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	select {
	case body := <-received:
		if body["service"] != "scheduling" {
			t.Errorf("expected service=scheduling, got %v", body["service"])
		}
		if body["companyId"] != "co-1" {
			t.Errorf("expected companyId=co-1, got %v", body["companyId"])
		}
		if body["status"] != "SUCCESS" {
			t.Errorf("expected status=SUCCESS, got %v", body["status"])
		}
		if body["description"] != "Auto-assigned a technician to a job" {
			t.Errorf("expected a narrative description, got %v", body["description"])
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for activity-log ingest call")
	}
}

func TestMiddleware_SkipsGetRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	received := make(chan struct{}, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received <- struct{}{}
		w.WriteHeader(http.StatusAccepted)
	}))
	defer upstream.Close()

	r := gin.New()
	r.Use(Middleware(upstream.URL))
	r.GET("/technicians", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"items": []string{}})
	})

	req := httptest.NewRequest(http.MethodGet, "/technicians", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	select {
	case <-received:
		t.Fatal("GET request should never reach the activity-log ingest endpoint")
	case <-time.After(300 * time.Millisecond):
		// expected — no ingest call for a read
	}
}

func TestDescribe_NeverReturnsRawMethodAndPath(t *testing.T) {
	cases := []struct{ method, path string }{
		{http.MethodPost, "/dispatch/assign"},
		{http.MethodPost, "/dispatch/assign/manual"},
		{http.MethodPost, "/gps"},
		{http.MethodPatch, "/technicians/:id"},
	}
	for _, tc := range cases {
		_, description := describe(tc.method, tc.path)
		if strings.Contains(description, tc.method) || strings.Contains(description, "/") {
			t.Errorf("describe(%q, %q) leaked raw HTTP text: %q", tc.method, tc.path, description)
		}
	}
}
