import React from 'react';
import { Collapse, Badge } from 'antd';
const { Panel } = Collapse;
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
import { blue } from '@ant-design/colors';


class NoteBacklinks extends React.Component {

    constructor(props) {
        super(props);
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
                                style={{ backgroundColor: blue[5] }}
                            />
                        }
                    </>
                    }
                    >
                    {this.props.backlinks &&
                        (
                            <ul>
                                {this.props.backlinks.map((note, index) => {
                                    return (
                                        <li key={note.key}>
                                            <NoteBreadCrumb parents={note.parents} handleClickNote={this.props.handleClickNote} />
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
