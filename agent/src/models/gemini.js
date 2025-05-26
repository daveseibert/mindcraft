import { toSinglePrompt, strictFormat } from '../utils/text.js';

export class Gemini {
    constructor(model_name, url, params) {
        this.model_name = model_name;
        this.params = params || {};
        this.baseUrl = url || 'http://mindserver:8080/api';
        this.safetySettings = [
            {
                "category": "HARM_CATEGORY_DANGEROUS",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE",
            },
        ];
    }

    async sendRequest(turns, systemMessage) {
        const messages = [
            { role: 'system', content: systemMessage },
            ...strictFormat(turns)
        ];

        const pack = {
            model: this.model_name || "gemini-1.5-pro",
            messages,
            provider: 'gemini',
            safetySettings: this.safetySettings,
            ...(this.params || {})
        };

        try {
            console.log('Awaiting Gemini API response...');
            const response = await fetch(`${this.baseUrl}/create_completions`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pack)
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Received.');

            // Handle "thinking" models
            if (this.model_name?.includes("thinking")) {
                const parts = result.content.split('\n');
                return parts.length > 1 ? parts[1] : result.content;
            }

            return result.content;
        } catch (err) {
            console.log(err);
            return "My brain disconnected, try again.";
        }
    }

    async sendVisionRequest(turns, systemMessage, imageBuffer) {
        const messages = [...turns];
        messages.push({
            role: "user",
            content: [
                {
                    type: "text",
                    text: systemMessage
                },
                {
                    type: "image",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                    }
                }
            ]
        });

        const pack = {
            model: this.model_name || "gemini-pro-vision",
            messages: strictFormat(messages),
            provider: 'gemini',
            safetySettings: this.safetySettings,
            ...(this.params || {})
        };

        try {
            console.log('Awaiting Gemini API vision response...');
            const response = await fetch(`${this.baseUrl}/create_completions`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pack)
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();
            return result.content;
        } catch (err) {
            console.log(err);
            if (err.message.includes("vision") || err.message.includes("image")) {
                return "Vision is only supported by certain models.";
            }
            return "An unexpected error occurred, please try again.";
        }
    }

    async embed(text) {
        try {
            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "embedding-001",
                    input: text,
                    provider: 'gemini'
                })
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();
            return result[0].embedding;
        } catch (err) {
            console.error('Embedding error:', err);
            throw new Error('Failed to generate embeddings');
        }
    }
}
