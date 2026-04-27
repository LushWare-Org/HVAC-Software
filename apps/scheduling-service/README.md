# Scheduling & Dispatch Service

**Tech:** Go 1.22 + Gin framework + Supabase Postgres + PostGIS + Redis  
**Port:** 3003  
**Status:** Stub — to be built in Week 4  

## What this service handles
- Technician availability and shift management
- Real-time drag-and-drop dispatch board (Socket.IO)
- GPS live tracking (broadcast to admin + customer)
- Route optimization (PostGIS Phase 1, OR-Tools Phase 2)
- Service area management (geographic zones)
- AI smart auto-assignment (Phase 1 rule-based scoring)

## Structure (to be created Week 4)
```
scheduling-service/
├── cmd/server/main.go
├── internal/
│   ├── handlers/
│   ├── services/
│   ├── models/
│   └── middleware/
├── pkg/
│   ├── gps/
│   └── routing/
├── go.mod
└── Dockerfile
```

## Database
- Uses the shared Supabase PostgreSQL instance only.
- The scheduling schema is isolated with `search_path=scheduling,public`.
- PostGIS is required for technician radius scoring and GPS queries.

## Week 4 plan
1. Initialize Go module (go mod init)
2. Add Gin, pgx, redis, go-socketio dependencies
3. Create dispatch board WebSocket handlers
4. Implement GPS tracking endpoints
5. Build Phase 1 AI assignment scoring algorithm
