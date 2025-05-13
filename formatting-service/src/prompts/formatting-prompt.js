/**
 * Generate a prompt for the LLM to format raw analysis data
 */
function getFormattingPrompt(rawData) {
    return `
  I need you to convert the following website analysis into a structured JSON format.
  The analysis contains insights about a website, but needs to be organized into a consistent structure.
  
  Here is the raw analysis data:
  ${JSON.stringify(rawData, null, 2)}
  
  Please convert this into the following structured JSON format:
  
  \`\`\`json
  {
    "overview": {
      "executive_summary": "A 2-3 paragraph summary of the overall findings",
      "overall_score": 7, // Number between 1 and 10
    },
    "scores": [
      {
        "category": "Design",
        "score": 8, // Number between 1 and 10
        "description": "Brief description of the score"
      },
      // More scores...
    ],
    "critical_issues": [
      "Issue 1 description",
      "Issue 2 description",
      // More issues...
    ],
    "recommendations": [
      "Recommendation 1",
      "Recommendation 2",
      // More recommendations...
    ],
    "strengths": [
      "Strength 1",
      "Strength 2",
      // More strengths...
    ],
    "technical_summary": "Technical performance analysis paragraphs",
    "page_analyses": [
      {
        "page_type": "Homepage",
        "url": "https://example.com",
        "critical_flaws": [
          "Flaw 1",
          "Flaw 2"
        ],
        "recommendations": [
          "Recommendation 1",
          "Recommendation 2"
        ],
        "summary": "Page-specific summary paragraph"
      },
      // More pages...
    ]
  }
  \`\`\`
  
  Guidelines:
  1. Maintain all key insights from the original data
  2. Make sure all sections are properly populated
  3. Ensure all numeric scores are on a scale of 1-10
  4. Format lists consistently
  5. Return only valid JSON that follows the structure above
  6. Remove any redundant information
  7. If information for a section is missing, include an empty array or appropriate default value
  
  Return just the formatted JSON with no other text.
  `;
  }
  
  module.exports = { getFormattingPrompt };