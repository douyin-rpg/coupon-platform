// IP地理位置解析工具
// 使用 ip-api.com 免费API（支持中文，每分钟45次限制）

interface GeoInfo {
  ip: string;
  location: string; // 如 "中国 广东省 深圳市"
}

// 缓存IP地理位置，避免重复请求
const geoCache = new Map<string, string>();

export async function getGeoLocation(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return '本地';
  }

  // 检查缓存
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      const parts = [data.country, data.regionName, data.city].filter(Boolean);
      const location = parts.join(' ');
      geoCache.set(ip, location);
      return location;
    }
  } catch {
    // 静默失败
  }

  return '未知';
}

export async function getGeoBatch(ips: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueIps = [...new Set(ips.filter(ip => ip && ip !== '127.0.0.1' && ip !== '::1' && ip !== 'localhost'))];
  
  // ip-api.com 批量接口最多100个
  if (uniqueIps.length === 0) return result;

  // 先从缓存取
  const uncached: string[] = [];
  for (const ip of uniqueIps) {
    if (geoCache.has(ip)) {
      result.set(ip, geoCache.get(ip)!);
    } else {
      uncached.push(ip);
    }
  }

  if (uncached.length === 0) return result;

  try {
    const res = await fetch('http://ip-api.com/batch?lang=zh-CN&fields=status,query,country,regionName,city', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uncached.map(ip => ({ query: ip }))),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.status === 'success') {
          const parts = [item.country, item.regionName, item.city].filter(Boolean);
          const location = parts.join(' ');
          geoCache.set(item.query, location);
          result.set(item.query, location);
        }
      }
    }
  } catch {
    // 静默失败
  }

  return result;
}
