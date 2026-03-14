import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Query active model from Supabase
    const { data: activeModel, error } = await supabase
      .from('models')
      .select('openrouter_id')
      .eq('is_active', true)
      .single();

    if (error || !activeModel) {
      throw new Error('Could not find active model: ' + (error?.message || 'No active models'));
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY!;
    
    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: activeModel.openrouter_id,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const completion = await response.json();
    
    if (!response.ok) {
        throw new Error(completion.error?.message || 'Failed to fetch from OpenRouter');
    }

    return NextResponse.json({ 
        model_used: activeModel.openrouter_id, 
        reply: completion.choices[0].message.content 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
