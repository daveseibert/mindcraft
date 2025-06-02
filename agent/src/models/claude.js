import { strictFormat } from '../utils/text.js';
import { getKey } from '../utils/keys.js';

export class Claude {
    constructor(model_name, url, params) {
        this.model_name = model_name;
        this.params = params || {};
        this.baseUrl = url || 'http://mindserver:8080/api';
    }

    async sendRequest(turns, systemMessage) {
        const messages = [
            { role: 'system', content: systemMessage },
            ...strictFormat(turns)
        ];
        const pack = {
            model: this.model_name || "claude-3-sonnet-20240229",
            messages,
            provider: 'claude',
            max_tokens: this.params.thinking?.budget_tokens
                ? this.params.thinking.budget_tokens + 1000
                : this.params.max_tokens || 4096,
            ...(this.params || {})
        };

        try {
            console.log('Awaiting Claude API response...');
            const response = await fetch(`${this.baseUrl}/completions`, {
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
            return result.content;
        } catch (err) {
            if (err.message.includes("image input") ||
                err.message.includes("vision")) {
                console.log(err);
                return "Vision is only supported by certain models.";
            } else {
                console.log(err);
                return "My brain disconnected, try again.";
            }
        }
    }

    async sendVisionRequest(turns, systemMessage, imageBuffer) {
        const imageMessages = [...turns];
        imageMessages.push({
            role: "user",
            content: [
                {
                    type: "text",
                    text: systemMessage
                },
                {
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: "image/jpeg",
                        data: imageBuffer.toString('base64')
                    }
                }
            ]
        });

        const pack = {
            model: this.model_name || "claude-3-sonnet-20240229",
            messages: strictFormat(imageMessages),
            provider: 'claude',
            max_tokens: this.params.max_tokens || 4096,
            ...(this.params || {})
        };

        try {
            const response = await fetch(`${this.baseUrl}/completions`, {
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
            return 'Error processing vision request. Try again.';
        }
    }

    async embed(text) {
        throw new Error('Embeddings are not supported by Claude.');
    }
}
