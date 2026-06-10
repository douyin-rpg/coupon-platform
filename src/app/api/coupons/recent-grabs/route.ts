import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Step 1: Get recent grab records
    const { data: recentGrabs, error } = await supabase
      .from('user_coupons')
      .select('id, user_id, coupon_id, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !recentGrabs || recentGrabs.length === 0) {
      if (error) console.error('Error fetching recent grabs:', error);
      return NextResponse.json({
        records: generateMockRecords()
      });
    }

    // Step 2: Get unique user IDs and coupon IDs
    const userIds = [...new Set(recentGrabs.map(r => r.user_id))];
    const couponIds = [...new Set(recentGrabs.map(r => r.coupon_id))];

    // Step 3: Fetch user info
    const { data: users } = await supabase
      .from('users')
      .select('id, username, real_name')
      .in('id', userIds);

    // Step 4: Fetch coupon info
    const { data: coupons } = await supabase
      .from('coupons')
      .select('id, name')
      .in('id', couponIds);

    // Build lookup maps
    const userMap = new Map<string, { username: string; real_name: string }>();
    if (users) {
      for (const u of users) {
        userMap.set(u.id, { username: u.username, real_name: u.real_name });
      }
    }

    const couponMap = new Map<string, string>();
    if (coupons) {
      for (const c of coupons) {
        couponMap.set(c.id, c.name);
      }
    }

    // Step 5: Build records with masked usernames
    const records = recentGrabs.map(r => {
      const user = userMap.get(r.user_id);
      const displayName = user?.username || user?.real_name || '用户';
      // Mask username: show first 3 chars + ***
      const maskedName = displayName.length > 3
        ? displayName.slice(0, 3) + '***'
        : displayName + '***';

      return {
        username: maskedName,
        couponName: couponMap.get(r.coupon_id) || '优惠券',
        time: r.created_at
      };
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error('Recent grabs error:', err);
    return NextResponse.json({
      records: generateMockRecords()
    });
  }
}

function generateMockRecords() {
  const names = ['isd', '张三', '李四', '王五', '小刘', '赵六', '陈七', '周八', '吴九', '郑十',
    '刘一', '孙二', '杨三', '朱四', '何五', '林六', '马七', '高八', '罗九', '梁十'];
  const coupons = ['抖音1000元优惠券', '抖音5000元优惠券', '抖音10000元优惠券', '黄金百分百', '抖音2000元优惠券'];
  const records = [];
  for (let i = 0; i < 15; i++) {
    const nameIdx = Math.floor(Math.random() * names.length);
    const couponIdx = Math.floor(Math.random() * coupons.length);
    records.push({
      username: names[nameIdx] + '***',
      couponName: coupons[couponIdx],
      time: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });
  }
  return records;
}
