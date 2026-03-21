import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const botSupabase = createClient(supabaseUrl, supabaseAnonKey)

/** 특정 팀의 미완료 태스크 목록 조회 */
export async function getOpenTasks(team?: string): Promise<string[]> {
  // TASK_ADD 이벤트 가져오기
  let addQuery = botSupabase
    .from('vibe_events')
    .select('content')
    .eq('type', 'TASK_ADD')

  if (team) {
    addQuery = addQuery.eq('team', team)
  }

  const { data: addedTasks } = await addQuery

  // TASK_DONE 이벤트 가져오기
  let doneQuery = botSupabase
    .from('vibe_events')
    .select('content')
    .eq('type', 'TASK_DONE')

  if (team) {
    doneQuery = doneQuery.eq('team', team)
  }

  const { data: doneTasks } = await doneQuery

  const addedSet = new Map<string, number>()
  for (const t of addedTasks || []) {
    addedSet.set(t.content, (addedSet.get(t.content) || 0) + 1)
  }
  for (const t of doneTasks || []) {
    const count = addedSet.get(t.content) || 0
    if (count > 0) addedSet.set(t.content, count - 1)
  }

  return Array.from(addedSet.entries())
    .filter(([, count]) => count > 0)
    .map(([name]) => name)
}

/** 특정 팀의 활성 세션 조회 */
export async function getActiveSession(team?: string): Promise<string | null> {
  // 가장 최근 SESSION_START
  let startQuery = botSupabase
    .from('vibe_events')
    .select('content, timestamp')
    .eq('type', 'SESSION_START')
    .order('timestamp', { ascending: false })
    .limit(1)

  if (team) {
    startQuery = startQuery.eq('team', team)
  }

  const { data: starts } = await startQuery

  if (!starts || starts.length === 0) return null

  // 가장 최근 SESSION_END
  let endQuery = botSupabase
    .from('vibe_events')
    .select('timestamp')
    .eq('type', 'SESSION_END')
    .order('timestamp', { ascending: false })
    .limit(1)

  if (team) {
    endQuery = endQuery.eq('team', team)
  }

  const { data: ends } = await endQuery

  // START가 END보다 최신이면 활성 세션
  if (!ends || ends.length === 0 || starts[0].timestamp > ends[0].timestamp) {
    return starts[0].content
  }

  return null
}
