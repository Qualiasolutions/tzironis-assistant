import mistralClient, { 
  getChatCompletion, 
  getEmbeddings, 
  MISTRAL_MODELS,
  type MistralModel
} from './mistral-client';
import cache from './cache';

// Re-export for easier imports
export {
  getChatCompletion,
  getEmbeddings,
  MISTRAL_MODELS,
};
export type { MistralModel };
export { cache };

// Helper utility to analyze text sentiment
export const analyzeSentiment = async (text: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  summary: string;
}> => {
  const prompt = [
    {
      role: 'system',
      content: `You are a sentiment analysis expert. Analyze the following text and return a JSON object with:
1. sentiment: Either "positive", "neutral", or "negative"
2. score: A number from -1 (very negative) to 1 (very positive)
3. summary: A one-sentence summary of the sentiment`
    },
    {
      role: 'user',
      content: text
    }
  ];

  const response = await getChatCompletion(prompt, {
    temperature: 0.2,
    model: MISTRAL_MODELS.MISTRAL_SMALL
  });

  try {
    // Extract JSON from the response
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      sentiment: 'neutral',
      score: 0,
      summary: 'Unable to analyze sentiment properly.'
    };
  } catch (error) {
    console.error('Error parsing sentiment analysis:', error);
    return {
      sentiment: 'neutral',
      score: 0,
      summary: 'Error analyzing sentiment.'
    };
  }
};

// Helper utility to extract key entities from text
export const extractEntities = async (text: string): Promise<{
  entities: Array<{
    type: string;
    name: string;
    relevance: number;
  }>;
}> => {
  const prompt = [
    {
      role: 'system',
      content: `You are an entity extraction expert. Extract key entities from the following text and return a JSON object with:
"entities": An array of objects with:
- type: The entity type (e.g., "person", "organization", "location", "date", "product", etc.)
- name: The entity name
- relevance: A number from 0 to 1 indicating relevance to the main topic`
    },
    {
      role: 'user',
      content: text
    }
  ];

  const response = await getChatCompletion(prompt, {
    temperature: 0.3,
    model: MISTRAL_MODELS.MISTRAL_SMALL
  });

  try {
    // Extract JSON from the response
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      entities: []
    };
  } catch (error) {
    console.error('Error parsing entity extraction:', error);
    return {
      entities: []
    };
  }
};

export default {
  ...mistralClient,
  cache,
  analyzeSentiment,
  extractEntities
}; 