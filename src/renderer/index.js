import React from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/antd.css';

import 'antd/es/style/themes/default.less';
import './css/now-note.less';
import {App} from './components/App.jsx';



const appContainer = document.getElementById('n3-app');
const root = createRoot(appContainer);
root.render(
    <App />
);
