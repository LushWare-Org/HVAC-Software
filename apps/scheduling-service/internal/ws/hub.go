package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"github.com/tscrm/scheduling-service/internal/database"
	"github.com/tscrm/scheduling-service/internal/models"
)

// Hub manages all WebSocket connections, grouped by companyId.
// Architecture decisions:
//   - gorilla/websocket chosen over Socket.IO for cleaner Go idioms
//     (no Node.js socket.io-client dependency in the frontend — native WS works fine)
//   - Company-scoped broadcast: each company's clients only receive their own events
//   - Redis Pub/Sub fan-out: GPS updates come via Redis so any pod handles the WS connection
//     while any pod can ingest GPS data (horizontal scaling ready)
//   - Write pump + read pump goroutines per connection (gorilla best practice)
type Hub struct {
	// mu protects clients map
	mu sync.RWMutex
	// clients[companyID] = set of client connections
	clients map[string]map[*Client]bool

	// Redis client for pub/sub subscriptions
	redis *redis.Client
}

// Client represents a single WebSocket connection.
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	companyID string
	send      chan []byte // buffered channel for outbound messages
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10 // slightly less than pongWait
	maxMessageSize = 512                  // bytes — clients only send pings
	sendBufSize    = 256
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 4096,
	// Allow connections from the Next.js dev server and the production domain.
	// The full origin check happens at the Nginx / auth middleware level.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// NewHub creates a Hub and starts the Redis pub/sub listener.
func NewHub(redisClient *redis.Client) *Hub {
	h := &Hub{
		clients: make(map[string]map[*Client]bool),
		redis:   redisClient,
	}
	return h
}

// StartRedisSubscriber subscribes to all GPS and assignment channels.
// Uses a pattern subscription so we pick up any new company automatically.
func (h *Hub) StartRedisSubscriber(ctx context.Context) {
	pubsub := h.redis.PSubscribe(ctx,
		database.GPSChannelPrefix+"*",
		database.AssignmentChannelPrefix+"*",
	)

	go func() {
		defer pubsub.Close()
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				h.broadcastFromRedis(msg.Channel, []byte(msg.Payload))
			}
		}
	}()

	log.Println("📡 Redis pub/sub subscriber started (gps:* + assignment:*)")
}

// broadcastFromRedis parses the channel name to extract companyId
// and broadcasts the raw JSON payload to all connected clients of that company.
func (h *Hub) broadcastFromRedis(channel string, payload []byte) {
	var companyID string
	switch {
	case len(channel) > len(database.GPSChannelPrefix) &&
		channel[:len(database.GPSChannelPrefix)] == database.GPSChannelPrefix:
		companyID = channel[len(database.GPSChannelPrefix):]
	case len(channel) > len(database.AssignmentChannelPrefix) &&
		channel[:len(database.AssignmentChannelPrefix)] == database.AssignmentChannelPrefix:
		companyID = channel[len(database.AssignmentChannelPrefix):]
	default:
		return
	}

	h.broadcast(companyID, payload)
}

// broadcast sends a payload to all clients in a company room.
func (h *Hub) broadcast(companyID string, payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients[companyID] {
		select {
		case client.send <- payload:
		default:
			// Slow client — close it rather than blocking the broadcast
			go client.conn.Close()
		}
	}
}

// BroadcastMessage encodes a WSMessage as JSON and publishes it to Redis
// so all service pods can fan it out to their connected clients.
func (h *Hub) BroadcastMessage(ctx context.Context, msg models.WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("⚠️  Failed to marshal WS message: %v", err)
		return
	}

	var channel string
	switch {
	case msg.Type == models.WSTypeGPSUpdate:
		channel = database.GPSChannel(msg.CompanyID)
	default:
		channel = database.AssignmentChannel(msg.CompanyID)
	}

	if err := h.redis.Publish(ctx, channel, data).Err(); err != nil {
		log.Printf("⚠️  Redis publish failed on %s: %v", channel, err)
	}
}

// ServeWS upgrades an HTTP connection to WebSocket and registers the client.
// URL: GET /ws?companyId=<uuid>   (companyId validated by auth middleware)
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, companyID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("⚠️  WS upgrade failed: %v", err)
		return
	}

	client := &Client{
		hub:       h,
		conn:      conn,
		companyID: companyID,
		send:      make(chan []byte, sendBufSize),
	}

	h.register(client)

	// Each connection runs two goroutines (gorilla recommended pattern):
	// writePump: serialises writes to the connection
	// readPump: drains incoming frames (pings/close frames) and detects disconnection
	go client.writePump()
	go client.readPump()
}

func (h *Hub) register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[c.companyID] == nil {
		h.clients[c.companyID] = make(map[*Client]bool)
	}
	h.clients[c.companyID][c] = true
}

func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room := h.clients[c.companyID]; room != nil {
		delete(room, c)
		if len(room) == 0 {
			delete(h.clients, c.companyID)
		}
	}
}

// ---- writePump ----
// Serialises all writes to a single goroutine per connection.
// Sends a ping every pingPeriod to detect dead connections.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		c.hub.unregister(c)
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ---- readPump ----
// Drains incoming frames and responds to control frames.
// Clients only send pings — we don't process application messages from the browser.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			if websocket.IsUnexpectedCloseError(err,
				websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WS read error: %v", err)
			}
			break
		}
	}
}
