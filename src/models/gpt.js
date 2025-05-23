import OpenAIApi from 'openai';
import { getKey, hasKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

export class GPT {
    constructor(model_name, url, params) {
        this.model_name = model_name;
        this.params = params;

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
            stop: stop_seq,
            ...(this.params || {})
        };
        if (this.model_name.includes('o1')) {
            delete pack.stop;
        }

        const url = "http://fastapi/create_completions";
        // try {
        //     const response = await fetch(url, {
        //         method: "POST",
        //         body: JSON.stringify(pack),
        //         // …
        //     });
        //     if (!response.ok) {
        //         console.error(response.status);
        //         console.log(response.json());
        //         throw new Error(`Response status: ${response.status}`);
        //     }
        //
        //     const json = await response.json();
        //     console.log(json);
        // } catch (error) {
        //     console.error(error.message);
        // }

        let res = null;

        try {
            console.log('Awaiting openai api response from model', this.model_name)
            // console.log('Messages:', messages);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pack),
                // …
            });
            let response_json = await response.json();
            res = response_json.content;
            console.log(res);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
            // let completion = await this.openai.chat.completions.create(pack);
            // if (completion.choices[0].finish_reason == 'length')
            //     throw new Error('Context length exceeded');
            // console.log('Received.')
            // res = completion.choices[0].message.content;
        }
        catch (err) {
            if ((err.message == 'Context length exceeded' || err.code == 'context_length_exceeded') && turns.length > 1) {
                console.log('Context length exceeded, trying again with shorter context.');
                return await this.sendRequest(turns.slice(1), systemMessage, stop_seq);
            } else if (err.message.includes('image_url')) {
                console.log(err);
                res = 'Vision is only supported by certain models.';
            } else {
                console.log(err);
                res = 'My brain disconnected, try again.';
            }
        }
        return res;
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
        
        return this.sendRequest(imageMessages, systemMessage);
    }

    async embed(text) {
        const url = "http://fastapi/embeddings";
        if (text.length > 8191) {
            text = text.slice(0, 8191);
        }

        try {
            const model = this.model_name || "text-embedding-3-small";
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    input: text
                })
            });

            if (!response.ok) {
                throw new Error(`Embedding request failed with status: ${response.status}`);
            }

            const embeddings = await response.json();
            console.log('Embedding response received.');

            if (!Array.isArray(embeddings) || !embeddings[0]?.embedding) {
                console.error('Invalid embedding response format:', embeddings);
                throw new Error('Invalid embedding response format');
            }

            return embeddings[0].embedding;
        } catch (err) {
            console.error('Embedding error:', err);
            throw err;
        }
    }


}



