import React from 'react';
import { Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

class NoteBreadCrumb extends React.Component {


    constructor() {
        super();
    }

    activateNote(noteKey) {
        this.props.activateNote(noteKey);
    }

    render() {

        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item key="root" href="#" onClick={(event)=> this.activateNote(undefined, event)}>
                        <HomeOutlined />
                    </Breadcrumb.Item>

                    {this.props.parents &&
                        (this.props.parents.map((parentNote, i) => <Breadcrumb.Item key={parentNote.key} href="#" onClick={(event)=> this.activateNote(parentNote.key, event)}>{parentNote.title}</Breadcrumb.Item>))
                    }
                </Breadcrumb>
            </>
        );
    }
}

export {NoteBreadCrumb};