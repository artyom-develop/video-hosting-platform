from prometheus_client import Counter, Histogram, Gauge
import time

# API метрики
api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint']
)

# Стриминг метрики
active_streams = Gauge(
    'active_streams_total',
    'Total active streams'
)

total_viewers = Gauge(
    'total_viewers_gauge',
    'Total viewers across all streams'
)

stream_views_total = Counter(
    'stream_views_total',
    'Total stream views',
    ['stream_id', 'channel_id']
)

# Система метрики
database_connections = Gauge(
    'database_connections_gauge',
    'Active database connections'
)

redis_connections = Gauge(
    'redis_connections_gauge',
    'Active Redis connections'
)

registered_users_total = Gauge(
    'registered_users_total',
    'Total registered users'
)

active_channels = Gauge(
    'active_channels_gauge',
    'Total active channels'
)

class PrometheusMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        method = scope["method"]
        path = scope["path"]

        async def send_with_metrics(message):
            if message["type"] == "http.response.start":
                status = message["status"]
                duration = time.time() - start_time
                
                api_requests_total.labels(
                    method=method,
                    endpoint=path,
                    status=status
                ).inc()
                
                api_request_duration_seconds.labels(
                    method=method,
                    endpoint=path
                ).observe(duration)

            await send(message)

        await self.app(scope, receive, send_with_metrics)
