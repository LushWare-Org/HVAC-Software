package middleware

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

// AuthClaims holds the validated token claims we care about.
// Auth0 Actions inject company_id and role into the token namespace.
type AuthClaims struct {
	UserID    string
	CompanyID string
	Role      string
	Email     string
	Name      string
}

const (
	ClaimsKey    = "claims"     // gin context key for AuthClaims
	companyIDKey = "company_id" // Auth0 custom namespace claim
	roleKey      = "role"
)

// JWTMiddleware returns a Gin handler that validates Auth0 RS256 JWTs.
// lestrrat-go/jwx is used because:
//   - Built-in JWKS auto-refresh (configurable interval)
//   - Handles RS256 natively without manual key parsing
//   - No CGo dependency (unlike some OpenSSL-backed libs)
func JWTMiddleware(auth0Domain, audience string) gin.HandlerFunc {
	// Build the JWKS auto-cache — this fetches once at startup and
	// refreshes every 15 minutes so key rotations are handled automatically.
	jwksURI := fmt.Sprintf("https://%s/.well-known/jwks.json", auth0Domain)
	cache := jwk.NewCache(context.Background())
	cache.Register(jwksURI, jwk.WithMinRefreshInterval(15*time.Minute))

	// Pre-warm the cache at startup; a failure here is non-fatal (will retry on first request)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if _, err := cache.Refresh(ctx, jwksURI); err != nil {
		fmt.Printf("⚠️  JWKS pre-warm failed (will retry on first request): %v\n", err)
	}

	issuer := fmt.Sprintf("https://%s/", auth0Domain)

	return func(c *gin.Context) {
		// 0. BYPASS_AUTH mode — development/testing only, never in production
		if os.Getenv("BYPASS_AUTH") == "true" && os.Getenv("GIN_MODE") != "release" {
			// Check headers first, then fall back to query params (needed for
			// WebSocket connections where the browser API cannot send custom headers).
			companyID := c.GetHeader("x-test-company-id")
			if companyID == "" {
				companyID = c.Query("x-test-company-id")
			}
			if companyID != "" {
				readBypassHeader := func(name string) string {
					if v := c.GetHeader(name); v != "" {
						return v
					}
					return c.Query(name)
				}

				userID := readBypassHeader("x-test-user-id")
				if userID == "" {
					userID = "test-user-001"
				}
				role := strings.ToLower(readBypassHeader("x-test-user-role"))
				if role == "" {
					role = "company_admin"
				}
				email := readBypassHeader("x-test-user-email")
				if email == "" {
					email = "test@demo.tscrm.dev"
				}
				name := readBypassHeader("x-test-user-name")
				if name == "" {
					name = "Test User"
				}
				claims := AuthClaims{
					UserID:    userID,
					CompanyID: companyID,
					Role:      role,
					Email:     email,
					Name:      name,
				}
				c.Set(ClaimsKey, claims)
				c.Next()
				return
			}
		}

		// 1. Extract token. For browser WebSocket requests, allow a query token
		// because custom Authorization headers are not available in native WS API.
		authHeader := c.GetHeader("Authorization")
		tokenStr := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else if c.Request.URL.Path == "/ws" {
			tokenStr = strings.TrimSpace(c.Query("access_token"))
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization token"})
			return
		}

		// 2. Peek at the JWT header to determine algorithm (HS256 vs RS256)
		var parsedToken jwt.Token
		var parseErr error

		if alg := peekJWTAlgorithm(tokenStr); alg == "HS256" {
			// Local JWT signed with symmetric secret
			localSecret := os.Getenv("JWT_SECRET")
			if localSecret == "" {
				localSecret = "tscrm-local-jwt-secret-change-in-production"
			}
			parsedToken, parseErr = jwt.Parse(
				[]byte(tokenStr),
				jwt.WithKey(jwa.HS256, []byte(localSecret)),
				jwt.WithValidate(true),
			)
		} else {
			// Auth0 / RS256 — use JWKS key set
			keySet, err := cache.Get(c.Request.Context(), jwksURI)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "failed to fetch JWKS"})
				return
			}
			parsedToken, parseErr = jwt.Parse(
				[]byte(tokenStr),
				jwt.WithKeySet(keySet),
				jwt.WithValidate(true),
				jwt.WithIssuer(issuer),
				jwt.WithAudience(audience),
			)
		}

		if parseErr != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token: " + parseErr.Error()})
			return
		}

		token := parsedToken

		// 4. Extract custom claims from the validated token.
		// lestrrat-go/jwx/v2 private claim extraction via token.Get() can silently
		// return nil for non-registered claims in some configurations. We validate
		// the signature with the library (above) and then read the raw payload
		// directly so that company_id/role always resolve correctly.
		rawPayload := peekJWTPayload(tokenStr)

		getStr := func(key string) string {
			if rawPayload != nil {
				if v, ok := rawPayload[key].(string); ok {
					return v
				}
			}
			// Fallback: try lestrrat-go/jwx token.Get()
			if v, ok := token.Get(key); ok {
				return fmt.Sprintf("%v", v)
			}
			return ""
		}

		claims := AuthClaims{
			UserID:    token.Subject(),
			CompanyID: getStr(companyIDKey),
			Role:      getStr(roleKey),
			Email:     getStr("email"),
			Name:      getStr("name"),
		}

		// 5. Guard: company_id must be present (all our users must belong to a company)
		if claims.CompanyID == "" || claims.CompanyID == "<nil>" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "company_id claim missing"})
			return
		}

		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

// GetClaims extracts AuthClaims from a Gin context.
// Panics if called outside an authenticated route (programming error).
func GetClaims(c *gin.Context) AuthClaims {
	v, _ := c.Get(ClaimsKey)
	claims, ok := v.(AuthClaims)
	if !ok {
		panic("GetClaims called outside authenticated route")
	}
	return claims
}

// RequireRole creates a middleware that ensures the caller has one of the
// specified roles. Call after JWTMiddleware.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		claims := GetClaims(c)
		if !allowed[claims.Role] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":    "insufficient role",
				"required": roles,
				"actual":   claims.Role,
			})
			return
		}
		c.Next()
	}
}

// peekJWTAlgorithm decodes the JWT header (without verification) and returns
// the "alg" field. Returns "" if the token cannot be decoded.
func peekJWTAlgorithm(tokenStr string) string {
	parts := strings.SplitN(tokenStr, ".", 3)
	if len(parts) < 2 {
		return ""
	}
	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return ""
	}
	var header map[string]interface{}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return ""
	}
	if alg, ok := header["alg"].(string); ok {
		return alg
	}
	return ""
}

// peekJWTPayload decodes the JWT payload (without verification) and returns
// the claims map. Only call this AFTER the token signature has been verified.
func peekJWTPayload(tokenStr string) map[string]interface{} {
	parts := strings.SplitN(tokenStr, ".", 3)
	if len(parts) < 2 {
		return nil
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil
	}
	return payload
}
