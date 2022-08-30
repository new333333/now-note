import React from 'react';

import { AudioOutlined } from '@ant-design/icons';
import { Input, Space } from 'antd';
const { Search } = Input;

class NotesList extends React.Component {

    constructor() {
        super();
    }

    render() {
        return (
            <div className="pane-content">
                <Space direction="vertical">
                    <Search placeholder="input search text" allowClear style={{ width: '100%' }} />
                </Space>
            </div>
        );
    }
}

export {NotesList};