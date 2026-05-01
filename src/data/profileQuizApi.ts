import { supabase } from '@data/supabase';
import type { QuizResults } from '@domain/profileQuiz';

export async function saveQuizResults(results: QuizResults): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error: upsertError } = await supabase
    .from('profile_quiz_results')
    .upsert({
      user_id:          user.id,
      love_style:       results.loveStyle,
      conflict_style:   results.conflictStyle,
      safety_style:     results.safetyStyle,
      love_answers:     results.loveAnswers,
      conflict_answers: results.conflictAnswers,
      safety_answers:   results.safetyAnswers,
      completed_at:     new Date().toISOString(),
    });

  if (upsertError) throw upsertError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ quiz_completed: true })
    .eq('id', user.id);

  if (profileError) throw profileError;
}
