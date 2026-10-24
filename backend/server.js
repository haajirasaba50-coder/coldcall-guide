import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

app.use(express.json({ limit: '200kb' }));

const allowedOrigin =
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        !origin ||
        origin === allowedOrigin ||
        allowedOrigin === '*'
      ) {
        return cb(null, true);
      }

      // Allow preview URLs during development.
      // Restrict this to trusted origins in production.
      return cb(null, true);
    }
  })
);

// Supabase configuration
const supabase =
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

const stages = [
  'Opening',
  'Purpose',
  'Permission',
  'Their business',
  'Their need, in their words',
  'Objection',
  'Next step',
  'Close'
];

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'callcompass-api',
    databaseConfigured: Boolean(supabase),
    llmConfigured: Boolean(process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Check database configuration
function requireDb(res) {
  if (!supabase) {
    res.status(503).json({
      error:
        'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    });
    return false;
  }

  return true;
}

// Create a new call
app.post('/api/calls', async (req, res) => {
  if (!requireDb(res)) return;

  try {
    const prospect_name = String(
      req.body.prospect_name || 'Unknown prospect'
    )
      .trim()
      .slice(0, 160);

    const company_name = String(req.body.company_name || '')
      .trim()
      .slice(0, 160);

    const { data, error } = await supabase
      .from('calls')
      .insert({
        prospect_name,
        company_name,
        current_stage: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Create call error:', error.message);
      return res.status(500).json({
        error: 'Could not create the call.'
      });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create call error:', err.message);
    res.status(500).json({
      error: 'An unexpected error occurred while creating the call.'
    });
  }
});

// Save a stage result
app.patch('/api/calls/:id/stages/:stageNumber', async (req, res) => {
  if (!requireDb(res)) return;

  try {
    const stageNumber = Number(req.params.stageNumber);

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1 ||
      stageNumber > 8
    ) {
      return res.status(400).json({
        error: 'stageNumber must be between 1 and 8'
      });
    }

    const event_key = String(
      req.body.event_key || 'not_recorded'
    ).slice(0, 80);

    const prospect_words = String(
      req.body.prospect_words || ''
    ).slice(0, 4000);

    const { data, error } = await supabase
      .from('call_stage_results')
      .upsert(
        {
          call_id: req.params.id,
          stage_number: stageNumber,
          event_key,
          prospect_words,
          saved_at: new Date().toISOString()
        },
        {
          onConflict: 'call_id,stage_number'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Save stage error:', error.message);
      return res.status(500).json({
        error: 'Could not save the call stage.'
      });
    }

    const { error: updateError } = await supabase
      .from('calls')
      .update({ current_stage: stageNumber })
      .eq('id', req.params.id);

    if (updateError) {
      console.error('Update current stage error:', updateError.message);
    }

    res.json(data);
  } catch (err) {
    console.error('Save stage error:', err.message);
    res.status(500).json({
      error: 'An unexpected error occurred while saving the stage.'
    });
  }
});

// Close a call and save its outcome
app.post('/api/calls/:id/close', async (req, res) => {
  if (!requireDb(res)) return;

  try {
    const allowed = [
      'Meeting booked',
      'Follow-up scheduled',
      'Send information',
      'Referred to someone',
      'Not interested',
      'No answer / wrong contact',
      'Call dropped / ended early',
      'Other'
    ];

    const outcome = allowed.includes(req.body.outcome)
      ? req.body.outcome
      : 'Other';

    const next_step = String(req.body.next_step || '').slice(0, 500);
    const next_step_at = String(req.body.next_step_at || '').slice(0, 200);

    const requestedStage = Number(req.body.current_stage) || 1;
    const current_stage = Math.max(
      1,
      Math.min(8, requestedStage)
    );

    const { data, error } = await supabase
      .from('calls')
      .update({
        call_ended_at: new Date().toISOString(),
        outcome,
        next_step,
        next_step_at,
        current_stage
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Close call error:', error.message);
      return res.status(500).json({
        error: 'Could not close the call.'
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Close call error:', err.message);
    res.status(500).json({
      error: 'An unexpected error occurred while closing the call.'
    });
  }
});

// Get call history
app.get('/api/calls', async (_req, res) => {
  if (!requireDb(res)) return;

  try {
    const { data, error } = await supabase
      .from('calls')
      .select(
        '*, call_stage_results(stage_number,event_key,prospect_words)'
      )
      .order('call_started_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Load history error:', error.message);
      return res.status(500).json({
        error: 'Could not load call history.'
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Load history error:', err.message);
    res.status(500).json({
      error: 'An unexpected error occurred while loading history.'
    });
  }
});

// Get one call with its stage results
app.get('/api/calls/:id', async (req, res) => {
  if (!requireDb(res)) return;

  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*, call_stage_results(*)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Call not found.'
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Load call error:', err.message);
    res.status(500).json({
      error: 'An unexpected error occurred while loading the call.'
    });
  }
});

// AI coaching suggestion using Groq
app.post('/api/coach', async (req, res) => {
  const { stage, event, prospectWords } = req.body || {};

  const fallback =
    'Acknowledge what they said, ask one clear follow-up, and respect their decision.';

  if (!process.env.GROQ_API_KEY) {
    return res.json({
      suggestion: fallback,
      source: 'fallback'
    });
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          reasoning_effort: 'low',
          max_completion_tokens: 1000,
          messages: [
            
{
  role: 'system',
  content: `You are a practical and ethical cold-call coach.

Your job is to suggest exactly ONE natural sentence the caller can say next.

Follow these rules:
1. Match the selected call stage and event.
2. Use the prospect's actual words when provided.
3. If the prospect asks a question, answer it directly and honestly.
4. If the prospect says they are busy, respect their time.
5. If the prospect says they already have a team, acknowledge it without criticizing their team.
6. Never invent company details, promises, meeting agreements, or facts.
7. Never use placeholders such as [Company] or [relevant area].
8. If important details are missing, use a neutral sentence that does not assume facts.
9. If the prospect clearly says no, politely respect their decision.
10. Do not repeat the same generic sales pitch at every stage.

Return only one conversational sentence, under 30 words. Do not include explanations or reasoning.`
},

            {
              role: 'user',
              content: [
                `Stage: ${String(stage || 'Not specified').slice(0, 100)}`,
                `Event: ${String(event || 'Not specified').slice(0, 200)}`,
                `Prospect's actual words: ${String(
                  prospectWords || 'Not provided'
                ).slice(0, 1000)}`,
                'Return only one sentence for the caller to say next.'
              ].join('\n')
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        'Groq API error:',
        response.status,
        errorBody.slice(0, 500)
      );

      throw new Error(`Groq returned ${response.status}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error(
        'Groq returned empty content. Finish reason:',
        json.choices?.[0]?.finish_reason
      );

      return res.json({
        suggestion: fallback,
        source: 'fallback'
      });
    }

    return res.json({
      suggestion: content,
      source: 'llm'
    });
  } catch (err) {
    console.error('Groq LLM error:', err.message);

    return res.json({
      suggestion: fallback,
      source: 'fallback'
    });
  }
});

// Start the server
const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`CallCompass API listening on ${port}`);
});
