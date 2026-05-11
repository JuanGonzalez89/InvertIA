const BCBA_OPEN_HOUR = 11;
const BCBA_CLOSE_HOUR = 17;

const HOLIDAYS_MM_DD = new Set([
  "01-01",
  "03-24",
  "04-02",
  "05-01",
  "05-25",
  "06-20",
  "07-09",
  "12-08",
  "12-25",
]);

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getBuenosAiresParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const weekday = WEEKDAY_INDEX[byType.weekday] ?? 0;
  const month = Number(byType.month);
  const day = Number(byType.day);
  const hour = Number(byType.hour);
  const minute = Number(byType.minute);

  return { weekday, month, day, hour, minute };
}

export function getBCBAMarketStatus(now: Date = new Date()) {
  const { weekday, month, day, hour, minute } = getBuenosAiresParts(now);
  const holidayKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isWeekend = weekday === 0 || weekday === 6;
  const isHoliday = HOLIDAYS_MM_DD.has(holidayKey);
  
  // El mercado abre a las 11:00 y cierra a las 17:00
  const isAfterOpen = hour > BCBA_OPEN_HOUR || (hour === BCBA_OPEN_HOUR && minute >= 0);
  const isBeforeClose = hour < BCBA_CLOSE_HOUR;
  const isWithinSession = isAfterOpen && isBeforeClose;

  const isOpen = !isWeekend && !isHoliday && isWithinSession;

  let label = "Mercado cerrado";
  if (isOpen) {
    label = "Mercado abierto";
  } else if (isWeekend) {
    label = "Fin de semana";
  } else if (isHoliday) {
    label = "Feriado";
  } else if (hour >= BCBA_CLOSE_HOUR) {
    label = "Mercado cerrado (post-cierre)";
  } else if (hour < BCBA_OPEN_HOUR) {
    label = "Mercado cerrado (pre-apertura)";
  }

  // Calculamos el tiempo relativo al cierre si cerró hoy
  let closedSince: Date | null = null;
  if (!isOpen && !isWeekend && !isHoliday && hour >= BCBA_CLOSE_HOUR) {
    closedSince = new Date(now);
    closedSince.setHours(BCBA_CLOSE_HOUR, 0, 0, 0);
  }

  return {
    isOpen,
    label,
    isWeekend,
    isHoliday,
    closedSince,
    currentHour: hour,
    currentMinute: minute
  };
}
