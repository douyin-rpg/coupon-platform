import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(req: NextRequest) {
  const admin = await verifyAdminAuth(req);
  if (!admin) return NextResponse.json({ error: '未授权' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 限制文件大小 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过5MB' }, { status: 400 });
    }

    // 限制文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持JPG/PNG/WEBP格式' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${timestamp}_${cleanName}`;

    // 使用 Supabase Storage 上传
    const supabase = getSupabaseClient();

    // 确保 bucket 存在（首次使用时自动创建）
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasBucket = buckets?.some((b: { name: string }) => b.name === 'uploads');
    if (!hasBucket) {
      await supabase.storage.createBucket('uploads', { public: true });
    }

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return NextResponse.json({ error: `上传失败: ${error.message}` }, { status: 500 });
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl || '';

    return NextResponse.json({
      key: fileName,
      url: publicUrl,
      fileName: cleanName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '上传失败';
    console.error('Upload error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
