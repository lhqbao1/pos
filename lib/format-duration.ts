export const formatElapsedDuration = (startedAt?: string | null, nowMs?: number) => {
  if (!startedAt) return "--:--:--";

  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) return "--:--:--";

  const elapsedMs = Math.max(0, (nowMs ?? Date.now()) - startedMs);
  const totalSeconds = Math.floor(elapsedMs / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

