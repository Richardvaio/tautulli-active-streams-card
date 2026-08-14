import type {
  ActiveStream,
  CardConfig,
  CardEnvelope,
  EntrySummary,
  HomeAssistant,
} from "./types";

const DOMAIN = "tautulli_active_streams";
export const SUPPORTED_SCHEMA = 1;

export async function getEntries(hass: HomeAssistant): Promise<EntrySummary[]> {
  const response = await hass.callWS<{ schema_version: number; entries: EntrySummary[] }>({
    type: `${DOMAIN}/get_entries`,
  });
  return response.entries ?? [];
}

export async function subscribeActive(
  hass: HomeAssistant,
  entryId: string,
  callback: (data: CardEnvelope<ActiveStream>) => void,
): Promise<() => void> {
  return hass.connection.subscribeMessage(callback, {
    type: `${DOMAIN}/subscribe_active_streams`,
    entry_id: entryId,
  });
}

export async function getCardData(
  hass: HomeAssistant,
  config: CardConfig,
): Promise<CardEnvelope<unknown>> {
  const common = {
    entry_id: config.entry_id,
    limit: config.mode === "recently_added" && config.recent_grouping !== "none"
      ? Math.min(50, (config.max_items ?? 12) * 4)
      : config.max_items,
  };
  if (config.mode === "recently_added") {
    const mediaType = ["movie", "show", "artist"].includes(config.media_type ?? "")
      ? config.media_type
      : undefined;
    return hass.callWS({
      type: `${DOMAIN}/get_recently_added`,
      ...common,
      ...(mediaType ? { media_type: mediaType } : {}),
      ...(config.section_id ? { section_id: config.section_id } : {}),
    });
  }
  if (config.mode === "popular") {
    return hass.callWS({
      type: `${DOMAIN}/get_home_stats`,
      ...common,
      stat_id: config.stat_id,
      time_range: config.time_range,
      metric: config.metric,
      ...(config.section_id ? { section_id: config.section_id } : {}),
      ...(config.user_id ? { user_id: config.user_id } : {}),
    });
  }
  if (config.mode === "users") {
    return hass.callWS({
      type: `${DOMAIN}/get_user_stats`,
      entry_id: config.entry_id,
    });
  }
  return hass.callWS({
    type: `${DOMAIN}/get_history`,
    ...common,
    ...(config.user_id ? { user_id: config.user_id } : {}),
  });
}

export async function getLibraries(hass: HomeAssistant, entryId: string) {
  return hass.callWS<CardEnvelope<{ section_id: string; name: string; type: string }>>({
    type: `${DOMAIN}/get_libraries`,
    entry_id: entryId,
  });
}

export async function getUsers(hass: HomeAssistant, entryId: string) {
  return hass.callWS<CardEnvelope<{ user_id: string; display_name: string }>>({
    type: `${DOMAIN}/get_users`,
    entry_id: entryId,
  });
}

export async function terminateSession(
  hass: HomeAssistant,
  entryId: string,
  sessionId: string,
): Promise<{ succeeded: boolean }> {
  return hass.callWS({
    type: `${DOMAIN}/terminate_session`,
    entry_id: entryId,
    session_id: sessionId,
  });
}
