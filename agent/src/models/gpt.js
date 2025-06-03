import OpenAIApi from 'openai';
import { getKey, hasKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

export class GPT {
    constructor(model_name, url, params) {
        this.model_name = model_name;
        this.params = params;
        this.baseUrl = url || 'http://fastapi:80';

        let config = {};
        if (url)
            config.baseURL = url;

        if (hasKey('OPENAI_ORG_ID'))
            config.organization = getKey('OPENAI_ORG_ID');

        // config.apiKey = getKey('OPENAI_API_KEY');

        // this.openai = new OpenAIApi(config);
    }

    async sendRequest(turns, systemMessage, stop_seq='***') {
        let messages = [{'role': 'system', 'content': systemMessage}].concat(turns);
        messages = strictFormat(messages);
        const pack = {
            model: this.model_name || "gpt-3.5-turbo",
            messages,
            provider: 'openai',
            stop: stop_seq,
            ...(this.params || {})
        };
        if (this.model_name.includes('o1')) {
            delete pack.stop;
        }

        try {
            console.log('Awaiting OpenAI API response from model', this.model_name);
            const response = await fetch(`${this.baseUrl}/completions`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pack)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`API request failed: ${errorText}`);
            }

            const result = await response.json();
            console.log('Response received:', result);
            if (!result.content) {
                console.error('Empty content in response:', result);
                throw new Error('Empty response from API');
            }
            return result.content;
        } catch (err) {
            if ((err.message.includes('context_length_exceeded') ||
                    err.message.includes('maximum context length')) &&
                turns.length > 1) {
                console.log('Context length exceeded, trying again with shorter context.');
                return await this.sendRequest(turns.slice(1), systemMessage, stop_seq);
            } else if (err.message.includes('image')) {
                console.log(err);
                return 'Vision is only supported by certain models.';
            } else {
                console.log(err);
                return 'My brain disconnected, try again.';
            }
        }
    }

    async sendVisionRequest(messages, systemMessage, imageBuffer) {
        const imageMessages = [...messages];
        imageMessages.push({
            role: "user",
            content: [
                { type: "text", text: systemMessage },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                    }
                }
            ]
        });

        const pack = {
            model: this.model_name || "gpt-4-vision-preview",
            messages: strictFormat(imageMessages),
            provider: 'openai',
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
        if (text.length > 8191) {
            text = text.slice(0, 8191);
        }

        try {
            // Add debug logging
            // console.log('Sending embedding request to:', `${this.baseUrl}/embeddings`);
            // console.log('Request payload:', {
            //     model: this.model_name || "text-embedding-3-small",
            //     input: text,
            //     provider: 'openai'
            // });

            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model_name || "text-embedding-3-small",
                    input: text,
                    provider: 'openai'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Embedding error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Embedding request failed with status: ${response.status}\nResponse: ${errorText}`);
            }

            const result = await response.json();
            // console.log('Embedding response received:', result);

            // Check if the response matches the expected format
            if (!Array.isArray(result) || !result[0]?.embedding) {
                console.error('Unexpected response format:', result);
                throw new Error('Invalid embedding response format');
            }

            return result[0].embedding;
        } catch (err) {
            console.error('Embedding error:', err);
            throw err;
        }
    }


}



