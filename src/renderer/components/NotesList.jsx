import React from 'react';

import { Input, Space, Breadcrumb } from 'antd';
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
                List...
            </div>
        );
    }
}

export {NotesList};