import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { DisplayLarge } from 'baseui/typography';
import { Tabs, Tab, StatefulTabs } from 'baseui/tabs-motion';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

interface ApiResponse {
    content?: string;
    error?: string;
}

function App() {
    const [inputText, setInputText] = useState<string>('');
    const [fastapiResponse, setFastapiResponse] = useState<ApiResponse | null>(null);
    const [elysiaResponse, setElysiaResponse] = useState<ApiResponse | null>(null);
    const [activeKey, setActiveKey] = useState<React.Key>(0);

    const callFastAPI = async () => {
        try {
            const response = await fetch('http://localhost:8008/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: inputText }],
                    model: 'gpt-4',
                }),
            });
            const data = await response.json();
            setFastapiResponse(data);
        } catch (error) {
            setFastapiResponse({ error: 'Failed to fetch from FastAPI' });
        }
    };

    const callElysia = async () => {
        try {
            const response = await fetch('http://localhost:3000/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: inputText }],
                    model: 'gpt-4',
                }),
            });
            const data = await response.json();
            setElysiaResponse(data);
        } catch (error) {
            setElysiaResponse({ error: 'Failed to fetch from Elysia' });
        }
    };

    const compareResponses = () => {
        if (!fastapiResponse || !elysiaResponse) return true;
        return JSON.stringify(fastapiResponse) === JSON.stringify(elysiaResponse);
    };

    return (
        <Block padding="scale800" maxWidth="1200px" margin="0 auto">
            <Block marginBottom="scale800">
                <DisplayLarge>API Comparison Tool</DisplayLarge>
            </Block>

            <Block marginBottom="scale800">
                <Input
                    value={inputText}
                    onChange={e => setInputText(e.currentTarget.value)}
                    placeholder="Enter your prompt here..."
                    size="large"
                    overrides={{
                        Root: {
                            style: {
                                width: '100%',
                            },
                        },
                        Input: {
                            style: {
                                minHeight: '100px',
                            },
                        },
                    }}
                />
            </Block>

            <Block marginBottom="scale800">
                <Button
                    onClick={() => {
                        callFastAPI();
                        callElysia();
                    }}
                    size="large"
                >
                    Send to Both APIs
                </Button>
            </Block>

            <StatefulTabs
                initialState={{ activeKey: 0 }}
                renderAll
            >
                <Tab title="FastAPI Response">
                    {fastapiResponse && (
                        <Block
                            padding="scale400"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="radius200"
                        >
                            <JSONPretty data={fastapiResponse} />
                        </Block>
                    )}
                </Tab>
                <Tab title="Elysia Response">
                    {elysiaResponse && (
                        <Block
                            padding="scale400"
                            border="1px solid"
                            borderColor="border"
                            borderRadius="radius200"
                        >
                            <JSONPretty data={elysiaResponse} />
                        </Block>
                    )}
                </Tab>
                <Tab title="Comparison">
                    {fastapiResponse && elysiaResponse && (
                        <Block>
                            <Block marginBottom="scale400">Responses Comparison:</Block>
                            <Block
                                padding="scale400"
                                border="1px solid"
                                borderColor="border"
                                borderRadius="radius200"
                            >
                                <Block marginBottom="scale400">
                                    Arrays match: {compareResponses() ? '✅' : '❌'}
                                </Block>
                                {!compareResponses() && (
                                    <Block>
                                        <Block marginBottom="scale400">Differences:</Block>
                                        <JSONPretty
                                            data={{
                                                fastapi: fastapiResponse,
                                                elysia: elysiaResponse
                                            }}
                                        />
                                    </Block>
                                )}
                            </Block>
                        </Block>
                    )}
                </Tab>
            </StatefulTabs>
        </Block>
    );
}

export default App;
