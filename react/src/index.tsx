import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron } from 'styletron-engine-atomic';
import { LightTheme, BaseProvider } from 'baseui';
import App from './App';

const engine = new Styletron();

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <StyletronProvider value={engine}>
            <BaseProvider theme={LightTheme}>
                <App />
            </BaseProvider>
        </StyletronProvider>
    </React.StrictMode>
);
