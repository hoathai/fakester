import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return { data, error };
}

export async function createTeam(name, userId) {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, owner_id: userId })
    .select()
    .single();

  if (teamError) return { data: null, error: teamError };

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: userId,
      role: 'owner',
    });

  if (memberError) return { data: null, error: memberError };

  return { data: team, error: null };
}

export async function getUserTeams(userId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams(id, name, owner_id, created_at)')
    .eq('user_id', userId);

  if (error) return { data: null, error };

  const teams = data.map(item => item.teams);
  return { data: teams, error: null };
}

export async function getFakeUsers(teamId) {
  const { data, error } = await supabase
    .from('fake_users')
    .select(`
      *,
      fake_user_tags(
        tag_id,
        tags(id, name, color)
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createFakeUser(fakeUser) {
  const { data, error } = await supabase
    .from('fake_users')
    .insert(fakeUser)
    .select()
    .single();

  return { data, error };
}

export async function updateFakeUser(id, updates) {
  const { data, error } = await supabase
    .from('fake_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteFakeUser(id) {
  const { error } = await supabase
    .from('fake_users')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getTags(teamId) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('team_id', teamId)
    .order('name');

  return { data, error };
}

export async function createTag(tag) {
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single();

  return { data, error };
}

export async function deleteTag(id) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  return { error };
}

export async function addTagToFakeUser(fakeUserId, tagId) {
  const { error } = await supabase
    .from('fake_user_tags')
    .insert({ fake_user_id: fakeUserId, tag_id: tagId });

  return { error };
}

export async function removeTagFromFakeUser(fakeUserId, tagId) {
  const { error } = await supabase
    .from('fake_user_tags')
    .delete()
    .eq('fake_user_id', fakeUserId)
    .eq('tag_id', tagId);

  return { error };
}
