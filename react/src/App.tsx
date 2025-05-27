// src/App.tsx
import React, { useState } from 'react';
import {
    ChakraProvider,
    Box,
    VStack,
    Button,
    Text,
    Textarea,
    Container,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from '@chakra-ui/react';
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
        <ChakraProvider>
            <Container maxW="container.xl" py={8}>
                <VStack spacing={6} align="stretch">
                    <Text fontSize="2xl" fontWeight="bold">API Comparison Tool</Text>

                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter your prompt here..."
                        size="lg"
                    />

                    <Button colorScheme="blue" onClick={() => {
                        callFastAPI();
                        callElysia();
                    }}>
                        Send to Both APIs
                    </Button>

                    <Tabs>
                        <TabList>
                            <Tab>FastAPI Response</Tab>
                            <Tab>Elysia Response</Tab>
                            <Tab>Comparison</Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel>
                                {fastapiResponse && (
                                    <Box borderWidth="1px" borderRadius="lg" p={4}>
                                        <JSONPretty data={fastapiResponse} />
                                    </Box>
                                )}
                            </TabPanel>
                            <TabPanel>
                                {elysiaResponse && (
                                    <Box borderWidth="1px" borderRadius="lg" p={4}>
                                        <JSONPretty data={elysiaResponse} />
                                    </Box>
                                )}
                            </TabPanel>
                            <TabPanel>
                                {fastapiResponse && elysiaResponse && (
                                    <VStack spacing={4} align="stretch">
                                        <Text>Response Comparison:</Text>
                                        <Box borderWidth="1px" borderRadius="lg" p={4}>
                                            <Text>
                                                Arrays match: {compareResponses() ? '✅' : '❌'}
                                            </Text>
                                            {!compareResponses() && (
                                                <VStack mt={4} spacing={4}>
                                                    <Text>Differences:</Text>
                                                    <JSONPretty
                                                        data={{
                                                            fastapi: fastapiResponse,
                                                            elysia: elysiaResponse
                                                        }}
                                                    />
                                                </VStack>
                                            )}
                                        </Box>
                                    </VStack>
                                )}
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </VStack>
            </Container>
        </ChakraProvider>
    );
}

export default App;
