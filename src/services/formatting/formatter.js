const Anthropic = require('@anthropic-ai/sdk');
const { getFormattingPrompt } = require('./prompts/formatting-prompt');
const { validateStructuredData } = require('./utils/validator');

class Formatter {
  constructor(options = {}) {
    this.model = options.model || 'claude-3-7-sonnet-20250219';
    
    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  async format(rawAnalysisData) {
    try {
      // Check if API key is available
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          status: 'error',
          error: 'ANTHROPIC_API_KEY environment variable is not set'
        };
      }
      
      // Generate prompt for formatting
      const prompt = getFormattingPrompt(rawAnalysisData);
      
      // Call LLM to format the data
      console.log('   Calling LLM for formatting...');
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        system: "You are a data structuring assistant. Your job is to convert unstructured website analysis data into a consistent JSON format. Follow the formatting instructions exactly."
      });
      
      // Extract and parse the JSON from the response
      let formattedData;
      try {
        // Look for JSON structure in the response
        const content = response.content[0].text;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) ||
                         content.match(/{[\s\S]*}/);
        
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        formattedData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('   ❌ Error parsing LLM response as JSON:', parseError);
        return {
          status: 'error',
          error: `Failed to parse LLM response as JSON: ${parseError.message}`
        };
      }
      
      // Validate the structured data
      console.log('   🔍 Validating structured data...');
      const validationResult = validateStructuredData(formattedData);
      
      if (validationResult.valid) {
        return {
          status: 'success',
          data: validationResult.data
        };
      } else {
        console.error('   ❌ Validation failed:', validationResult.errors);
        return {
          status: 'error',
          error: 'Structured data validation failed: ' + validationResult.errors.join('; '),
          data: formattedData // Return the unvalidated data for debugging
        };
      }
      
    } catch (error) {
      console.error('Error during formatting:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = { Formatter };