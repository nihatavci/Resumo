// src/app/api/tailor-generate/route.ts
import { generateObject, type Message, type LanguageModelV1, type TelemetrySettings } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { startAIUsageRequest, finishAIUsageRequest } from '@/lib/ai/usage-ledger';
import type { Resume } from '@/lib/types';

/**
 * Takes the chat conversation + master CV and produces the structured
 * tailored resume in ONE generateObject call.
 *
 * This is intentionally separate from the streaming chat — generateObject
 * with a Zod schema is the most reliable way to get structured output
 * from Workers AI Llama.
 */

const proposeChangesSchema = z.object({
  professional_summary: z
    .string()
    .optional()
    .describe('Optional rewritten summary paragraph tailored for the target role.'),
  work_experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      date: z.string(),
      location: z.string().optional(),
      description: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
    })
  ),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ),
  rationale: z.string(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as {
    messages: Message[];
    masterResume: Resume;
  };
  const { messages, masterResume } = body;

  console.log('[tailor-generate] start, chat history length:', messages.length);

  const { model, usageEventId, telemetry } = await startAIUsageRequest({
    route: 'api.tailor-generate',
    userId,
    isPro: true,
  });

  // Distill the chat into a single text block for the AI
  const chatHistory = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `You are an ATS resume tailoring expert.
Given (1) the candidate's MASTER CV, (2) a chat conversation where the user has discussed a target job and any preferences, produce the final tailored resume.

CRITICAL RULES:
1. PRESERVE ALL FACTS — every company, position, date, location, and metric must remain exactly as in the master. Never invent achievements.
2. Return EXACTLY ${masterResume.work_experience?.length ?? 0} work_experience entries — the SAME number as the master. Never drop or merge jobs.
3. For each work_experience entry:
   - Keep company/position/date/location unchanged.
   - REWRITE bullets to use action verbs and keywords from the job description (mentioned in the chat) WHERE THE CANDIDATE ACTUALLY DID THAT WORK.
   - Reorder bullets so the most relevant ones come first.
4. For skills: reorder so JD-relevant categories and items come first. May rename a category to match JD terminology. Never invent skills.
5. Provide a rationale: 2-3 sentences plain English on what changed and why.`;

  try {
    const { object, usage } = await generateObject({
      model: model as LanguageModelV1,
      experimental_telemetry: telemetry as TelemetrySettings,
      schema: proposeChangesSchema,
      system: systemPrompt,
      prompt: `MASTER CV (JSON):
${JSON.stringify(
  {
    professional_summary: masterResume.professional_summary,
    work_experience: masterResume.work_experience,
    skills: masterResume.skills,
  },
  null,
  2
)}

CONVERSATION (most recent at the bottom):
${chatHistory}

Produce the tailored version now. Return exactly ${masterResume.work_experience?.length ?? 0} work_experience entries.`,
    });

    await finishAIUsageRequest({ usageEventId, status: 'succeeded', usage });

    console.log('[tailor-generate] success:', {
      work_count: object.work_experience.length,
      skill_categories: object.skills.length,
    });

    // Safety: if work entry count mismatched, drop the change
    if (object.work_experience.length !== (masterResume.work_experience?.length ?? 0)) {
      return Response.json({
        error: `AI dropped entries (master has ${masterResume.work_experience?.length}, got ${object.work_experience.length}). Try again or paste a clearer JD.`,
      }, { status: 422 });
    }

    return Response.json({ proposed: true, ...object });
  } catch (err) {
    console.error('[tailor-generate] error:', err);
    await finishAIUsageRequest({
      usageEventId,
      status: 'failed',
      errorCode: err instanceof Error ? err.message : 'generate_failed',
    });
    return Response.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
