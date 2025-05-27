import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { DisplayLarge, DisplayMedium } from 'baseui/typography';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

interface ApiResponse {
    content?: string;
    error?: string;
    status?: number;
}

function App() {
    const [inputText, setInputText] = useState<string>('');
    const [fastapiResponse, setFastapiResponse] = useState<ApiResponse | null>(null);
    const [elysiaResponse, setElysiaResponse] = useState<ApiResponse | null>(null);
    const [fastapiHealth, setFastapiHealth] = useState<ApiResponse | null>(null);
    const [elysiaHealth, setElysiaHealth] = useState<ApiResponse | null>(null);

    let fastapiUrl = 'http://localhost:8008';
    let elysiaUrl = 'http://localhost:3002';

    const checkFastAPIHealth = async () => {
        try {
            const response = await fetch(`${fastapiUrl}/health`);
            const data = await response.json();
            setFastapiHealth({ ...data, status: response.status });
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setFastapiHealth({
                    error: 'Connection refused - server may be down',
                    status: 503
                });
            } else {
                setFastapiHealth({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 500
                });
            }
        }
    };

    const checkElysiaHealth = async () => {
        try {
            const response = await fetch(`${elysiaUrl}/health`);
            const data = await response.json();
            setElysiaHealth({ ...data, status: response.status });
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setElysiaHealth({
                    error: 'Connection refused - server may be down',
                    status: 503
                });
            } else {
                setElysiaHealth({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 500
                });
            }
        }
    };

    const callFastAPI = async () => {
        try {
            const response = await fetch(`${fastapiUrl}/completions`, {
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
            setFastapiResponse({ ...data, status: response.status });
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setFastapiResponse({
                    error: `Connection refused - server may be down`,
                    status: 503
                });
            } else {
                setFastapiResponse({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 500
                });
            }
        }
    };

    const callElysia = async () => {
        try {
            const response = await fetch(`${elysiaUrl}/completions`, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',  // Add this line
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: inputText }],
                    model: 'gpt-4',
                }),
            });

            const data = await response.json();
            setElysiaResponse({ ...data, status: response.status });
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                setElysiaResponse({
                    error: 'Connection refused - server may be down',
                    status: 503
                });
            } else {
                setElysiaResponse({
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 500
                });
            }
        }
    };

    const renderResponse = (response: ApiResponse | null) => {
        if (!response) return null;

        const statusColor = response.status && response.status >= 400 ?
            'rgb(255, 82, 82)' : 'rgb(52, 168, 83)';

        return (
            <>
                <Block
                    marginBottom="scale200"
                    overrides={{
                        Block: {
                            style: {
                                color: statusColor,
                                fontWeight: 500
                            }
                        }
                    }}
                >
                    Status: {response.status}
                </Block>
                <JSONPretty data={response} />
            </>
        );
    };

    const renderHealthStatus = (health: ApiResponse | null) => {
        if (!health) return null;

        const statusColor = health.status && health.status >= 400 ?
            'rgb(255, 82, 82)' : 'rgb(52, 168, 83)';

        return (
            <Block
                marginBottom="scale200"
                overrides={{
                    Block: {
                        style: {
                            color: statusColor,
                            fontWeight: 500
                        }
                    }
                }}
            >
                Health Status: {health.status} {health.error ? `(${health.error})` : ''}
            </Block>
        );
    };

    const compareResponses = () => {
        if (!fastapiResponse || !elysiaResponse) return true;
        return JSON.stringify(fastapiResponse) === JSON.stringify(elysiaResponse);
    };

    return (
        <Block padding="scale800" maxWidth="1400px" margin="0 auto">
            <Block marginBottom="scale800">
                <DisplayLarge>API Comparison Tool</DisplayLarge>
            </Block>

            {/* Health Check Buttons */}
            <Block display="flex" marginBottom="scale800">
                <Block flex={1} marginRight="scale400">
                    <Button
                        onClick={checkFastAPIHealth}
                        size="compact"
                        overrides={{
                            Root: {
                                style: {
                                    width: '100%',
                                    marginBottom: '8px'
                                }
                            }
                        }}
                    >
                        Check FastAPI Health
                    </Button>
                    {renderHealthStatus(fastapiHealth)}
                </Block>
                <Block flex={1} marginLeft="scale400">
                    <Button
                        onClick={checkElysiaHealth}
                        size="compact"
                        overrides={{
                            Root: {
                                style: {
                                    width: '100%',
                                    marginBottom: '8px'
                                }
                            }
                        }}
                    >
                        Check Elysia Health
                    </Button>
                    {renderHealthStatus(elysiaHealth)}
                </Block>
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

            <Block display="flex" width="100%">
                {/* FastAPI Column */}
                <Block flex={1} marginRight="scale400">
                    <Block marginBottom="scale400">
                        <DisplayMedium>FastAPI</DisplayMedium>
                    </Block>
                    <Block marginBottom="scale400">
                        <Button
                            onClick={callFastAPI}
                            size="compact"
                            overrides={{
                                Root: {
                                    style: {
                                        width: '100%',
                                    },
                                },
                            }}
                        >
                            Send to FastAPI
                        </Button>
                    </Block>
                    <Block
                        padding="scale400"
                        overrides={{
                            Block: {
                                style: {
                                    border: '1px solid',
                                    borderColor: 'rgb(232, 232, 232)',
                                    borderRadius: '8px',
                                    minHeight: '200px',
                                }
                            }
                        }}
                    >
                        {renderResponse(fastapiResponse)}
                    </Block>
                </Block>

                {/* Elysia Column */}
                <Block flex={1} marginLeft="scale400">
                    <Block marginBottom="scale400">
                        <DisplayMedium>Elysia</DisplayMedium>
                    </Block>
                    <Block marginBottom="scale400">
                        <Button
                            onClick={callElysia}
                            size="compact"
                            overrides={{
                                Root: {
                                    style: {
                                        width: '100%',
                                    },
                                },
                            }}
                        >
                            Send to Elysia
                        </Button>
                    </Block>
                    <Block
                        padding="scale400"
                        overrides={{
                            Block: {
                                style: {
                                    border: '1px solid',
                                    borderColor: 'rgb(232, 232, 232)',
                                    borderRadius: '8px',
                                    minHeight: '200px',
                                }
                            }
                        }}
                    >
                        {renderResponse(elysiaResponse)}
                    </Block>
                </Block>
            </Block>

            {/* Comparison Section */}
            {fastapiResponse && elysiaResponse && (
                <Block marginTop="scale800">
                    <Block marginBottom="scale400">
                        <DisplayMedium>Comparison</DisplayMedium>
                    </Block>
                    <Block
                        padding="scale400"
                        overrides={{
                            Block: {
                                style: {
                                    border: '1px solid',
                                    borderColor: 'rgb(232, 232, 232)',
                                    borderRadius: '8px',
                                }
                            }
                        }}
                    >
                        <Block marginBottom="scale400">
                            Responses match: {compareResponses() ? '✅' : '❌'}
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
        </Block>
    );
}

export default App;
