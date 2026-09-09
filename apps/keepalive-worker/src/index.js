const DEFAULT_MODE = "pause_at_night"
const DEFAULT_TIMEZONE = "Asia/Kolkata"
const DEFAULT_SLEEP_START_HOUR = 1
const DEFAULT_SLEEP_END_HOUR = 5

function normalizeBoolean(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function parseHour(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10)

  if (Number.isNaN(parsed) || parsed < 0 || parsed > 23) {
    return fallback
  }

  return parsed
}

function getLocalParts(now, timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const get = (type) => parts.find((part) => part.type === type)?.value || ""

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number.parseInt(get("hour"), 10),
  }
}

function getFullTimeDates(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function isNightPauseHour(hour, startHour, endHour) {
  if (startHour === endHour) {
    return false
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour
  }

  return hour >= startHour || hour < endHour
}

function shouldSkipPing(now, env) {
  const forceOff = normalizeBoolean(env.KEEPALIVE_FORCE_OFF)

  if (forceOff === "true" || forceOff === "1" || forceOff === "yes") {
    return {
      skip: true,
      reason: "force_off",
    }
  }

  const mode = String(env.KEEPALIVE_MODE || DEFAULT_MODE).trim().toLowerCase()

  if (mode === "always") {
    return {
      skip: false,
      reason: "always_on",
    }
  }

  const timezone = env.KEEPALIVE_TIMEZONE || DEFAULT_TIMEZONE
  const sleepStartHour = parseHour(
    env.KEEPALIVE_SLEEP_START_HOUR,
    DEFAULT_SLEEP_START_HOUR
  )
  const sleepEndHour = parseHour(
    env.KEEPALIVE_SLEEP_END_HOUR,
    DEFAULT_SLEEP_END_HOUR
  )

  const local = getLocalParts(now, timezone)
  const fullTimeDates = getFullTimeDates(env.KEEPALIVE_FULL_TIME_DATES)

  if (fullTimeDates.has(local.date)) {
    return {
      skip: false,
      reason: `full_time_override:${local.date}`,
    }
  }

  if (mode === "pause_at_night") {
    const skip = isNightPauseHour(local.hour, sleepStartHour, sleepEndHour)

    return {
      skip,
      reason: skip
        ? `night_pause:${local.hour}`
        : `active_window:${local.hour}`,
    }
  }

  return {
    skip: false,
    reason: `unknown_mode_fallback:${mode || "empty"}`,
  }
}

async function pingBackend(env) {
  const targetUrl = env.KEEPALIVE_TARGET_URL

  if (!targetUrl) {
    throw new Error("KEEPALIVE_TARGET_URL is required.")
  }

  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "user-agent": "glabeekid-keepalive/1.0",
      "cache-control": "no-cache",
    },
  })

  const body = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    body,
  }
}

async function handleKeepalive(env) {
  const now = new Date()
  const decision = shouldSkipPing(now, env)

  if (decision.skip) {
    return {
      ok: true,
      skipped: true,
      reason: decision.reason,
      timestamp: now.toISOString(),
    }
  }

  const ping = await pingBackend(env)

  return {
    ok: ping.ok,
    skipped: false,
    reason: decision.reason,
    status: ping.status,
    target: env.KEEPALIVE_TARGET_URL,
    timestamp: now.toISOString(),
    body: ping.body,
  }
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(handleKeepalive(env))
  },

  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/status") {
      const now = new Date()
      const decision = shouldSkipPing(now, env)

      return Response.json({
        ok: true,
        mode: env.KEEPALIVE_MODE || DEFAULT_MODE,
        forceOff: env.KEEPALIVE_FORCE_OFF || "false",
        target: env.KEEPALIVE_TARGET_URL || null,
        timezone: env.KEEPALIVE_TIMEZONE || DEFAULT_TIMEZONE,
        sleepStartHour:
          env.KEEPALIVE_SLEEP_START_HOUR || `${DEFAULT_SLEEP_START_HOUR}`,
        sleepEndHour:
          env.KEEPALIVE_SLEEP_END_HOUR || `${DEFAULT_SLEEP_END_HOUR}`,
        fullTimeDates:
          env.KEEPALIVE_FULL_TIME_DATES
            ?.split(",")
            .map((item) => item.trim())
            .filter(Boolean) || [],
        nextAction: decision.skip ? "skip" : "ping",
        reason: decision.reason,
        timestamp: now.toISOString(),
      })
    }

    if (url.pathname === "/run") {
      const result = await handleKeepalive(env)
      const status = result.ok ? 200 : 502

      return Response.json(result, { status })
    }

    return Response.json({
      ok: true,
      service: "glabeekid-backend-keepalive",
      routes: ["/status", "/run"],
    })
  },
}
