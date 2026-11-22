import { getSupabaseAdminClient } from '@/storage/database/supabase-client';

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
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'admin';
  content: string;
  is_read: boolean;
  created_at: string;
}

export async function getOrCreateConversation(userId: string): Promise<ChatConversation | null> {
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as ChatConversation;

  const { data: created, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: userId,
      status: 'open',
      unread_user: 0,
      unread_admin: 0,
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
): Promise<ChatMessage | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ conversation_id: conversationId, sender, content })
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
      last_message: message.content,
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