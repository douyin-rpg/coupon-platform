import { getSupabaseAdminClient } from '@/storage/database/supabase-client';
import type { NextRequest } from 'next/server';

export interface ChatConversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_user: number;
  unread_admin: number;
  created_at: string;
  updated_at: string;
  closed_by?: string | null;
  closed_at?: string | null;
  visitor_ip?: string | null;
  visitor_ua?: string | null;
  tags?: string[] | null;
  remark?: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  content: string;
  is_read: boolean;
  created_at: string;
  msg_type?: 'text' | 'image';
  image_url?: string | null;
}

export interface SupportSettings {
  online: 'online' | 'busy' | 'offline';
  work_start: string;
  work_end: string;
  auto_greeting: string;
}

const DEFAULT_SETTINGS: SupportSettings = {
  online: 'online',
  work_start: '09:00',
  work_end: '23:00',
  auto_greeting: '您好，欢迎来到惠抢券在线客服～请描述您遇到的问题，如：抢券失败、回兑进度、提现到账、账户绑定等，我们会尽快为您解答。',
};

/** 从请求中解析访客 IP（优先 x-forwarded-for，其次真实 IP 头） */
export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return '';
}

/** 解析 User-Agent 为可读设备描述 */
export function describeDevice(ua: string | null | undefined): {
  device: string;
  os: string;
  browser: string;
} {
  if (!ua) return { device: '未知设备', os: '', browser: '' };
  const u = ua;
  let device = '电脑';
  if (/iPad/i.test(u)) device = 'iPad';
  else if (/iPhone/i.test(u)) device = 'iPhone';
  else if (/Android/i.test(u)) {
    device = /Mobile/i.test(u) ? '安卓手机' : '安卓平板';
  } else if (/Windows Phone/i.test(u)) device = 'Windows 手机';
  else if (/Macintosh/i.test(u)) device = 'Mac';
  else if (/Windows/i.test(u)) device = 'Windows 电脑';

  let os = '';
  if (/Windows NT 11/i.test(u)) os = 'Windows 11';
  else if (/Windows NT 10/i.test(u)) os = 'Windows 10';
  else if (/Windows NT 6\.1/i.test(u)) os = 'Windows 7';
  else if (/Android (\d+[\.\d]*)/i.test(u)) os = `Android ${RegExp.$1}`;
  else if (/iPhone OS (\d+[_\d]*)/i.test(u)) os = `iOS ${RegExp.$1.replace(/_/g, '.')}`;
  else if (/Mac OS X (\d+[_\d]*)/i.test(u)) os = `macOS ${RegExp.$1.replace(/_/g, '.')}`;

  let browser = '';
  if (/YaBrowser/i.test(u)) browser = 'Yandex';
  else if (/Edg\//i.test(u)) browser = 'Edge';
  else if (/OPR\//i.test(u)) browser = 'Opera';
  else if (/Chrome\/(\d+)/i.test(u)) browser = `Chrome ${RegExp.$1}`;
  else if (/Firefox\/(\d+)/i.test(u)) browser = `Firefox ${RegExp.$1}`;
  else if (/Safari\/(\d+)/i.test(u)) browser = `Safari`;

  return { device, os, browser };
}

export async function getOrCreateConversation(
  userId: string,
  meta?: { ip?: string; ua?: string },
): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // 有 open 会话则更新访客 IP/设备（实时刷新设备信息）
    if (meta?.ip || meta?.ua) {
      await supabase
        .from('chat_conversations')
        .update({
          visitor_ip: meta.ip || existing.visitor_ip || '',
          visitor_ua: meta.ua || existing.visitor_ua || '',
        })
        .eq('id', existing.id);
      return {
        ...(existing as ChatConversation),
        visitor_ip: meta.ip || existing.visitor_ip || '',
        visitor_ua: meta.ua || existing.visitor_ua || '',
      };
    }
    return existing as ChatConversation;
  }

  const { data: created, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: userId,
      status: 'open',
      unread_user: 0,
      unread_admin: 0,
      visitor_ip: meta?.ip || '',
      visitor_ua: meta?.ua || '',
    })
    .select('*')
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (retry as ChatConversation) || null;
  }

  return created as ChatConversation;
}

export async function getConversationById(id: string): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as ChatConversation) || null;
}

export async function insertMessage(
  conversationId: string,
  sender: 'user' | 'admin',
  content: string,
  msgType: 'text' | 'image' = 'text',
  imageUrl?: string,
): Promise<ChatMessage | null> {
  const supabase = getSupabaseAdminClient();
  const row: Record<string, unknown> = { conversation_id: conversationId, sender, content };
  if (msgType === 'image') {
    row.msg_type = 'image';
    row.image_url = imageUrl || '';
  } else {
    row.msg_type = 'text';
  }
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(row)
    .select('*')
    .single();
  if (error) return null;
  return data as ChatMessage;
}

export async function touchConversation(
  conversation: ChatConversation,
  message: ChatMessage,
): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const unreadUser =
    message.sender === 'admin' ? conversation.unread_user + 1 : conversation.unread_user;
  const unreadAdmin =
    message.sender === 'user' ? conversation.unread_admin + 1 : conversation.unread_admin;

  const { data, error } = await supabase
    .from('chat_conversations')
    .update({
      last_message: message.msg_type === 'image' ? '[图片]' : message.content,
      last_message_at: new Date().toISOString(),
      unread_user: unreadUser,
      unread_admin: unreadAdmin,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id)
    .select('*')
    .single();

  if (error) return null;
  return { ...(data as ChatConversation), unread_user: unreadUser, unread_admin: unreadAdmin };
}

export async function markConversationRead(conversationId: string, role: 'user' | 'admin') {
  const supabase = getSupabaseAdminClient();
  const patch = role === 'admin' ? { unread_admin: 0 } : { unread_user: 0 };
  await supabase
    .from('chat_conversations')
    .update(patch)
    .eq('id', conversationId);
  await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('sender', role === 'admin' ? 'user' : 'admin');
}

export async function closeConversation(
  conversationId: string,
  by: 'admin' | 'user',
): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('chat_conversations')
    .update({
      status: 'closed',
      closed_by: by,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('status', 'open')
    .select('*')
    .single();
  if (error) return null;
  return data as ChatConversation;
}

export async function reopenConversation(conversationId: string): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('chat_conversations')
    .update({
      status: 'open',
      closed_by: null,
      closed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select('*')
    .single();
  if (error) return null;
  return data as ChatConversation;
}

export async function listUserConversations(userId: string): Promise<ChatConversation[]> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);
  return (data as ChatConversation[]) || [];
}

export async function listAllConversations(): Promise<
  (ChatConversation & { users: { username: string; real_name: string } | null })[]
> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('chat_conversations')
    .select('*, users(username, real_name)')
    .order('updated_at', { ascending: false })
    .limit(200);
  return (data as (ChatConversation & { users: { username: string; real_name: string } | null })[]) || [];
}

export async function listConversationsByStatus(
  status: 'open' | 'closed',
): Promise<(ChatConversation & { users: { username: string; real_name: string } | null })[]> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('chat_conversations')
    .select('*, users(username, real_name)')
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(200);
  return (data as (ChatConversation & { users: { username: string; real_name: string } | null })[]) || [];
}

export async function listMessages(
  conversationId: string,
  limit = 200,
): Promise<ChatMessage[]> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data as ChatMessage[]) || [];
}

// ─── 客服设置 ─────────────────────────────────
export async function getSupportSettings(): Promise<SupportSettings> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('system_settings').select('key, value');
  if (error) return DEFAULT_SETTINGS;
  const map: Record<string, string> = {};
  (data || []).forEach((r: { key: string; value: string }) => {
    map[r.key] = r.value;
  });
  return {
    online: (map['support_online'] as SupportSettings['online']) || DEFAULT_SETTINGS.online,
    work_start: map['support_work_start'] || DEFAULT_SETTINGS.work_start,
    work_end: map['support_work_end'] || DEFAULT_SETTINGS.work_end,
    auto_greeting: map['support_auto_greeting'] || DEFAULT_SETTINGS.auto_greeting,
  };
}

export async function updateSupportSettings(
  patch: Partial<SupportSettings>,
): Promise<SupportSettings> {
  const supabase = getSupabaseAdminClient();
  const entries: [string, string][] = [];
  if (patch.online !== undefined) entries.push(['support_online', patch.online]);
  if (patch.work_start !== undefined) entries.push(['support_work_start', patch.work_start]);
  if (patch.work_end !== undefined) entries.push(['support_work_end', patch.work_end]);
  if (patch.auto_greeting !== undefined) entries.push(['support_auto_greeting', patch.auto_greeting]);

  for (const [key, value] of entries) {
    await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
  return getSupportSettings();
}

// ─── 会话客户标签 / 备注 ───────────────────
export async function updateConversationTags(
  conversationId: string,
  tags: string[],
): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('chat_conversations')
    .update({ tags })
    .eq('id', conversationId)
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as ChatConversation;
}

export async function updateConversationRemark(
  conversationId: string,
  remark: string,
): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('chat_conversations')
    .update({ remark })
    .eq('id', conversationId)
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as ChatConversation;
}

// ─── 快捷话术库 ──────────────────────────
export interface QuickReply {
  id: string;
  content: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function listQuickReplies(): Promise<QuickReply[]> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('quick_replies')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(200);
  return (data as QuickReply[]) || [];
}

export async function createQuickReply(input: {
  content: string;
  category?: string;
  sort_order?: number;
}): Promise<QuickReply | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('quick_replies')
    .insert({
      content: input.content,
      category: input.category || '通用',
      sort_order: input.sort_order ?? 0,
    })
    .select('*')
    .single();
  if (error) return null;
  return data as QuickReply;
}

export async function deleteQuickReply(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('quick_replies').update({ is_active: false }).eq('id', id);
  return !error;
}