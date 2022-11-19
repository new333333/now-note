import React from 'react';
import { Collapse, Badge } from 'antd';
const { Panel } = Collapse;
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
            <Collapse bordered={false}>
                <Panel style={{ padding: "0" }}  header={
                    <>
                        Linked from &nbsp;

                        {this.props.backlinks &&
                            <Badge 
                                count={this.props.backlinks.length} 
                                style={{ backgroundColor: '#002766' }} 
                            />
                        }  
                    </>
                    }
                    >
                    {this.props.backlinks && 
                        (
                            <ul>
                                {this.props.backlinks.map((backlink, index) => {

                                    return (
                                        <li key={backlink.key}>
                                            <NoteBreadCrumb parents={backlink.parents} openNoteDetails={this.props.openNoteDetails} />
                                        </li>
                                    )


                                })}
                            </ul>
                        )
                    }
                </Panel>
            </Collapse>
        );
    }
}

export {NoteBacklinks};