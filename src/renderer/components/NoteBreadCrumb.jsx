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
            <div style={{padding: "5px"}}>
                {this.props.parents && 
                    <Breadcrumb>
                        {this.props.parents.map((parentNote, i) => <Breadcrumb.Item key={parentNote.key} href="#" onClick={(event)=> this.activateNote(parentNote.key, event)}>{parentNote.title}</Breadcrumb.Item>)}
                    </Breadcrumb>} 
            </div>
        );
    }
}

export {NoteBreadCrumb};