import React from 'react';
import { Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

class NoteBreadCrumb extends React.Component {


    constructor(props) {
        super(props);
    }

    render() {

        return (
            <Breadcrumb>
                {this.props.parents &&
                    (this.props.parents.map((parentNote, i) => 
                        <Breadcrumb.Item 
                            key={parentNote.key} 
                            href="#" 
                            onClick={(event)=> this.props.handleClickNote(parentNote.key)}>
                                {parentNote.type == "link" && parentNote.linkedNote.title}
                                {parentNote.type != "link" && parentNote.title}
                        </Breadcrumb.Item>))
                }
            </Breadcrumb>
        );
    }
}

export {NoteBreadCrumb};