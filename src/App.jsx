import React from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('app');
const root = createRoot(container);

root.render(<div>
    <h2>Hello from React in Electron!</h2>
</div>);