-- Lua скрипт для валидации ключей стримов
-- Этот скрипт будет вызван из nginx для проверки прав на публикацию

local key = ngx.var.arg_name or ""
local app = ngx.var.arg_app or ""

ngx.log(ngx.ERR, "=== Stream Validation ===")
ngx.log(ngx.ERR, "Key: " .. key)
ngx.log(ngx.ERR, "App: " .. app)

-- Если ключ пустой
if key == "" then
    ngx.status = 403
    ngx.log(ngx.ERR, "❌ No stream key provided")
    return ngx.HTTP_FORBIDDEN
end

-- Пытаемся проверить ключ через backend
local http = require "resty.http"
local httpc = http.new()

local uri = "http://" .. (os.getenv("BACKEND_HOST") or "backend") .. ":" .. 
            (os.getenv("BACKEND_PORT") or "8000") .. "/api/rtmp/publish"

ngx.log(ngx.ERR, "Validating key at: " .. uri)

local res, err = httpc:request_uri(uri, {
    method = "POST",
    body = "name=" .. key .. "&app=" .. app,
    headers = {
        ["Content-Type"] = "application/x-www-form-urlencoded",
    },
})

if not res then
    ngx.log(ngx.ERR, "❌ Validation error: " .. (err or "unknown"))
    ngx.status = 500
    return ngx.HTTP_INTERNAL_SERVER_ERROR
end

ngx.log(ngx.ERR, "Backend response: " .. res.status)

if res.status == 200 then
    ngx.log(ngx.ERR, "✅ Stream key validated")
    return ngx.HTTP_OK
else
    ngx.log(ngx.ERR, "❌ Stream key rejected: " .. (res.body or "unknown reason"))
    ngx.status = 403
    return ngx.HTTP_FORBIDDEN
end
