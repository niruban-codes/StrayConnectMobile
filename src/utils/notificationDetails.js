export function notificationDetails(item) {
  const title = item.title || 'Notification';
  const message = item.message || 'No additional details available.';
  const { latitude, longitude } = item;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  if (item.type === 'sighting' && hasCoordinates) {
    return {
      title,
      message: `${message}\n\nLatitude: ${latitude}\nLongitude: ${longitude}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latitude},${longitude}`)}&dir_action=navigate`,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`,
    };
  }
  return { title, message };
}
