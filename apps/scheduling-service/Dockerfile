# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY apps/scheduling-service/go.mod apps/scheduling-service/go.sum ./
RUN go mod download

# Copy source
COPY apps/scheduling-service/ .

# Build with optimisations
# CGO_ENABLED=0 → fully static binary (no libc dependency)
# -ldflags="-s -w" → strip debug symbols for smaller image
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o scheduling-service ./cmd/server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM alpine:3.19

# ca-certificates: required for Auth0 HTTPS (JWKS endpoint)
# tzdata: correct timezone handling in timestamps
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy only the compiled binary
COPY --from=builder /app/scheduling-service .

# Copy migrations for startup init (optional — can also run via CI)
COPY --from=builder /app/migrations/ ./migrations/

EXPOSE 3003

# Run as non-root for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENTRYPOINT ["./scheduling-service"]
