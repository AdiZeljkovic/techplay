# Production Environment Variables for Optimal Performance

# Add these to your production .env file

# ============================================
# CACHE & SESSION (Critical for Performance)
# ============================================
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# ============================================
# REDIS CONNECTION (Use phpredis for speed)
# ============================================
REDIS_CLIENT=phpredis
REDIS_PERSISTENT=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ============================================
# PULSE (Disable or use async ingest)
# ============================================
PULSE_ENABLED=false
# OR use Redis ingest (less overhead):
# PULSE_ENABLED=true
# PULSE_INGEST_DRIVER=redis

# ============================================
# OCTANE
# ============================================
OCTANE_SERVER=frankenphp

# ============================================
# DATABASE (Connection Pooling)  
# ============================================
# Add persistent connections
DB_PERSISTENT=true
