'use server'

interface SecurityResult {
  success: boolean;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateEmail(_formData: FormData): Promise<SecurityResult> {
  // In single-user mode with Cloudflare Access, email updates are managed externally.
  return { success: false, error: 'Email updates are not supported in single-user mode. Manage your email through Cloudflare Access.' };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updatePassword(_formData: FormData): Promise<SecurityResult> {
  // In single-user mode with Cloudflare Access, password updates are managed externally.
  return { success: false, error: 'Password updates are not supported in single-user mode. Authentication is managed through Cloudflare Access.' };
}


interface ApiTestResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function testApiKey(): Promise<ApiTestResult> {
  // API keys are now managed via environment variables, not stored in a vault.
  // This function tests the server-side OpenAI key from env.
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'No OpenAI API key configured in environment variables',
      };
    }

    const { default: OpenAI } = await import('openai');
    const { MODEL_DESIGNATIONS } = await import('@/lib/ai-models');

    const openai = new OpenAI({
      apiKey: apiKey.trim(),
    });

    const response = await openai.chat.completions.create({
      model: MODEL_DESIGNATIONS.FAST_CHEAP_FREE,
      messages: [{ role: 'user', content: 'Say this is a test!' }],
      response_format: { type: 'text' },
      temperature: 1,
      max_tokens: 8000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return {
      success: true,
      message: response.choices[0]?.message?.content || 'API connection successful',
    };
  } catch (error) {
    console.error('Error testing API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test API key',
    };
  }
}
