export const formatTime = (timeInSeconds = 0) => {
  let seconds = Math.floor(timeInSeconds % 60);
  let minutes = Math.floor((timeInSeconds / 60) % 60);
  let hours = Math.floor(timeInSeconds / (60 * 60));

  seconds = seconds.toString().padStart(2, '0');
  if (timeInSeconds >= 600) minutes = minutes.toString().padStart(2, '0');
  if (timeInSeconds >= 36000) hours = hours.toString().padStart(2, '0');

  return timeInSeconds >= 3600
    ? `${hours}:${minutes}:${seconds}`
    : `${minutes}:${seconds}`;
};

export const bound = (value, min = null, max = null) => {
  let boundedValue = value;

  if (min !== null) boundedValue = Math.max(min, value);
  if (max !== null) boundedValue = Math.min(max, boundedValue);

  return boundedValue;
};

export const isiOS = () =>
  [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
