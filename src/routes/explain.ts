import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// System prompt (fixed)
const SYSTEM_PROMPT = `You are a security assistant that explains suspicious website behavior to non-technical users.

CRITICAL RULES:
1. Give EXACTLY 2-3 complete sentences - no more, no less
2. First sentence: What the site is doing
3. Second sentence: Why this matters to the user
4. Optional third sentence: Recommendation (if needed)
5. Use simple, calm language - no technical jargon
6. Do NOT mention: JavaScript, code, DOM, APIs, or technical terms
7. Do NOT claim certainty or assume malware
8. Do NOT exaggerate the risk
9. End your response with a complete sentence - NEVER cut off mid-sentence

Example good response:
"This website appears to be monitoring what you type on your keyboard. This could mean someone is trying to capture your passwords or personal information. It's safer to leave this site and only enter sensitive data on verified websites."

Example bad response:
"This site is using JavaScript to track keystrokes which could indicate malicious intent. The DOM manipulation suggests..."`;


// Track calls per session (simple in-memory, in production use Redis/DB)
const sessionCalls = new Map<string, Set<string>>();

interface ExplainRequest {
  domain: string;
  page_context: string;
  risk_level: string;
  signals: string[];
}

/**
 * POST /api/explain-risk
 * Get AI explanation for risky website behavior
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { domain, page_context, risk_level, signals }: ExplainRequest = req.body;

    // Validate input
    if (risk_level !== 'high') {
      return res.status(400).json({
        success: false,
        error: 'Only high risk sites can request explanations'
      });
    }

    if (!signals || signals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Signals are required'
      });
    }

    if (signals.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 signals allowed'
      });
    }

    // Check rate limit: 1 call per site per session
    // DISABLED FOR TESTING - Re-enable in production
    // const sessionId = req.headers['x-session-id'] as string || 'default';
    // if (!sessionCalls.has(sessionId)) {
    //   sessionCalls.set(sessionId, new Set());
    // }
    // const calledSites = sessionCalls.get(sessionId)!;
    // if (calledSites.has(domain)) {
    //   return res.status(429).json({
    //     success: false,
    //     error: 'Explanation already requested for this site'
    //   });
    // }

    // Build user prompt
    const signalsBullets = signals.map(s => `- ${s.replace(/_/g, ' ')}`).join('\n');
    
    // Special handling for domain impersonation (phishing)
    const isDomainImpersonation = signals.includes('domain_impersonation');
    
    let userPrompt;
    if (isDomainImpersonation) {
      // Specific prompt for phishing attempts
      userPrompt = `⚠️ CRITICAL: This website is impersonating a trusted brand.

The domain name looks very similar to a legitimate website but it's NOT the real one.

Write EXACTLY 2-3 complete sentences explaining:
1. This is NOT the legitimate website (be clear and direct)
2. It's trying to steal your information by looking like the real site
3. You should leave immediately and visit the official website instead

Use simple language. Be firm but not alarmist. Complete sentences only.`;
    } else {
      // Normal prompt for other risky behaviors
      userPrompt = `A website (${page_context}) has triggered these security alerts:
${signalsBullets}

Write EXACTLY 2-3 complete sentences explaining:
1. What the website is doing
2. Why this matters to a regular user
3. What they should do

Remember: Complete sentences only. Simple language. No technical terms.`;
    }

    // Call Gemini
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { text: userPrompt }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000, // Allow sufficient tokens for complete responses
        temperature: 0.4, // Slightly more creative for natural language
        stopSequences: ['\n\n'] // Stop after explanation is complete
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ]
    });

    // Debug: Log full response
    console.log('[Gemini] Full response:', JSON.stringify(result.response, null, 2));

    // Check if response was blocked
    if (result.response.promptFeedback?.blockReason) {
      console.error('[Gemini] Response blocked:', result.response.promptFeedback.blockReason);
      return res.status(500).json({
        success: false,
        error: 'Content filtered by safety settings'
      });
    }

    // Get the text from the response
    let explanation = '';
    try {
      explanation = result.response.text().trim();
      console.log('[Gemini] Extracted text via text():', explanation);
    } catch (e) {
      console.warn('[Gemini] text() failed, trying candidates:', e);
      // If text() fails, try to get it from candidates
      const candidate = result.response.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        explanation = candidate.content.parts[0].text.trim();
        console.log('[Gemini] Extracted text via candidates:', explanation);
      } else {
        console.error('[Gemini] Could not extract text from response');
        throw new Error('Could not extract text from response');
      }
    }
    
    console.log('[Gemini] Final explanation length:', explanation.length);

    // Basic validation - just check if we got something
    if (!explanation || explanation.length < 20) {
      console.error('[Gemini] Explanation too short or empty:', explanation);
      return res.status(500).json({
        success: false,
        error: 'Generated explanation is empty or too short'
      });
    }

    // No maximum length limit - let the prompt control response length
    console.log('[Gemini] Explanation validated and ready to send');

    // Mark as called (DISABLED FOR TESTING)
    // calledSites.add(domain);

    res.json({
      success: true,
      explanation
    });

  } catch (error: any) {
    console.error('Error generating explanation:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to generate explanation',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;
