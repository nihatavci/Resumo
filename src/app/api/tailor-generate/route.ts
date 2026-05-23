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
    memoryPoints?: string[];
  };
  const { messages, masterResume, memoryPoints } = body;

  console.log('[tailor-generate] start, chat history length:', messages.length);

  const { model, usageEventId, telemetry, resolved } = await startAIUsageRequest({
    route: 'api.tailor-generate',
    userId,
    isPro: true,
  });
  console.log('[tailor-generate] model:', resolved.modelId, '| provider:', resolved.providerId);

  // Distill the chat into a single text block for the AI
  const chatHistory = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `You are an ATS resume tailoring expert.
Given (1) the candidate's MASTER CV, (2) a chat conversation where the user has discussed a target job and any preferences, produce the final tailored resume.

CRITICAL RULES — THESE ARE ABSOLUTE AND NON-NEGOTIABLE:

1. ZERO FABRICATION. Never add any concept, industry term, technology, platform, metric, responsibility, or context that does not already appear word-for-word (or by unmistakable implication) in the original bullet for that specific role. If the original bullet says nothing about E-Commerce, you cannot write E-Commerce. If the original says nothing about cloud, you cannot write cloud. This rule has no exceptions.

2. PRESERVE ALL FACTS. Every company, position, date, location, and metric must remain exactly as in the master. Never invent achievements, numbers, or technologies.

3. Return EXACTLY ${masterResume.work_experience?.length ?? 0} work_experience entries — the SAME number as the master. Never drop or merge jobs.

4. For each bullet point, the ONLY allowed changes are:
   a) Start with a stronger action verb (e.g. "Managed" → "Led").
   b) Reorder clauses within the same bullet for better flow.
   c) Make an existing metric more prominent.
   d) Remove a weak filler phrase (e.g. "responsible for").
   You CANNOT add new facts, skills, platforms, industries, or contexts.

5. If a keyword from the job description does not already appear in the candidate's bullets for a given role — DO NOT add it to that role. Either skip it or surface it as a gap in the rationale. Never inject JD keywords into bullets where the candidate did not do that work.

6. For skills: reorder so JD-relevant categories and items come first. You may rename a category to better match JD terminology only if the underlying skills are identical. Never invent skills not listed in the master.

7. Provide a rationale: 2-3 sentences in plain English describing only the changes actually made (reordering, stronger verbs, etc.) and any keyword gaps that could not be addressed because the experience isn't there.
${memoryPoints && memoryPoints.length > 0 ? `

AGREED DECISIONS FROM CHAT (apply these specifically when tailoring):
${memoryPoints.map((p) => `- ${p}`).join('\n')}` : ''}`;

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

Produce the tailored version now. Return exactly ${masterResume.work_experience?.length ?? 0} work_experience entries.

FINAL REMINDER BEFORE YOU OUTPUT: Read each bullet you are about to write and ask yourself — "Does this exact concept appear in the original bullet?" If NO, remove it. You are a copyeditor, not a ghostwriter. Strengthen what exists. Never invent.`,
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
