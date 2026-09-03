export const sendCommand = async (ip: string, command: 'start' | 'stop') => {
  if (!ip) return false;
  try {
    const res = await fetch(`http://${ip}/${command}`);
    if (res.ok) return true;
  } catch (err) {
    console.error(`Failed to send ${command} to ${ip}`, err);
  }
  return false;
};

export const sendManualCommand = async (
  ip: string,
  dir: 'forward' | 'backward' | 'left' | 'right' | 'stop'
) => {
  if (!ip) return false;
  try {
    const res = await fetch(`http://${ip}/manual?dir=${dir}`);
    if (res.ok) return true;
  } catch (err) {
    console.error(`Failed to send manual command ${dir} to ${ip}`, err);
  }
  return false;
};

export const sendNudge = async (ip: string, dir: 'left' | 'right', amount: 'small' = 'small') => {
  if (!ip) return false;
  try {
    const res = await fetch(`http://${ip}/nudge?dir=${dir}&amount=${amount}`);
    if (res.ok) return true;
  } catch (err) {
    console.error(`Failed to send nudge ${dir} to ${ip}`, err);
  }
  return false;
};
