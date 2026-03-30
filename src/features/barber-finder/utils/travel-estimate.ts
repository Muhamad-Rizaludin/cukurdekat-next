export function estimateTravelMinutes(distanceKm: number) {
  const averageCitySpeedKmh = 28;
  const minutes = Math.round((distanceKm / averageCitySpeedKmh) * 60);
  return Math.max(1, minutes);
}

export function formatTravelEstimate(distanceKm: number) {
  const minutes = estimateTravelMinutes(distanceKm);
  if (minutes < 60) {
    return `${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  return `${hours} jam ${remainingMinutes} menit`;
}
