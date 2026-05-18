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
  // Workers AI is accessed via the Cloudflare binding — no API key needed.
  // This function tests that the AI binding is functional.
  try {
    const { generateText } = await import('ai');
    const { initializeAIClient } = await import('@/utils/ai-tools');
    const { MODEL_DESIGNATIONS } = await import('@/lib/ai-models');

    const model = initializeAIClient({
      model: MODEL_DESIGNATIONS.FAST_CHEAP_FREE,
      apiKeys: [],
    });

    const response = await generateText({
      model,
      prompt: 'Say this is a test!',
      maxTokens: 100,
    });

    return {
      success: true,
      message: response.text || 'Workers AI connection successful',
    };
  } catch (error) {
    console.error('Error testing Workers AI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test Workers AI connection',
    };
  }
}
