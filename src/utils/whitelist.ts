const WHITELISTED_IPS = (process.env.WHITELISTED_IPS || '127.0.0.1,localhost').split(',').map(ip => ip.trim());

export const isIpWhitelisted = (ip: string): boolean => {
  // Handle IPv6 localhost
  const normalizedIp = ip === '::1' ? 'localhost' : ip.replace('::ffff:', '');
  return WHITELISTED_IPS.includes(normalizedIp) || WHITELISTED_IPS.includes(ip);
};
