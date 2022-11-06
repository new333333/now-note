import React from 'react';
import { Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

class NoteBreadCrumb extends React.Component {


    constructor() {
        super();
    }

    openNoteDetails(noteKey) {
        if (this.props.openNoteDetails) {
            this.props.openNoteDetails(noteKey);
        }
    }

    render() {

        return (
            <>
                <Breadcrumb>
                    <Breadcrumb.Item key="root" href="#" onClick={(event)=> this.openNoteDetails(undefined, event)}>
                        <HomeOutlined />
                    </Breadcrumb.Item>

                    {this.props.parents &&
                        (this.props.parents.map((parentNote, i) => <Breadcrumb.Item key={parentNote.key} href="#" onClick={(event)=> this.openNoteDetails(parentNote.key, event)}>{parentNote.title}</Breadcrumb.Item>))
                    }
                </Breadcrumb>
            </>
        );
    }
}

export {NoteBreadCrumb};