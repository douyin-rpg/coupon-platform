import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a clean filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folder}/${timestamp}_${cleanName}`;

    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type || 'image/jpeg',
    });

    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 365, // 1 year for admin uploads
    });

    return NextResponse.json({ key, url, fileName: cleanName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
