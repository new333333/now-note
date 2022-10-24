import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
import '@djthoms/pretty-checkbox';

class NoteBacklinks extends React.Component {

    constructor() {
        super();
    }

    render() {
        return (
            <>
                <h3>Linked from</h3>
                {this.props.backlinks && 
                    (
                        <ul>
                            {this.props.backlinks.map((backlink, index) => {

                                return (
                                    <li key={backlink.key}>
                                        <NoteBreadCrumb parents={backlink.parents} activateNote={this.props.activateNote} />
                                    </li>
                                )


                            })}
                        </ul>
                    )
                }
            </>
        );
    }
}

export {NoteBacklinks};