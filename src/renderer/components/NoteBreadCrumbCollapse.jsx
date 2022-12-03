import React from 'react';
import { Collapse, Tooltip } from 'antd';
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
const { Panel } = Collapse;

class NoteBreadCrumbCollapse extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        return (
                <>
                {
                    this.props.parents && 
                    <Collapse bordered={false} ghost style={{overflow: "hidden", whiteSpace: "nowrap"}}>
                        
                        <Panel header={
                            <Tooltip placement="bottomLeft" title={
                                this.props.parents.map((parent, index) => {

                                    return (
                                        <span key={parent.key}>
                                        {parent.title} { index < this.props.parents.length - 1 ? <>&nbsp;/&nbsp;</> : <></> }
                                        </span>
                                    )


                                })
                            }>
                                <span style={{color: "#bbb"}}>{
                                    this.props.parents.map((parent, index) => {

                                        return (
                                            <span key={parent.key}>
                                            {parent.title} { index < this.props.parents.length - 1 ? <span style={{padding: "0 5px"}}>/</span> : <></> }
                                            </span>
                                        )


                                    })
                                }
                                </span>
                            </Tooltip>
                            }
                            >
                            <NoteBreadCrumb parents={this.props.parents} handleClickNote={this.props.handleClickNote} />
                        </Panel>
                    </Collapse>
                }
                </>
        );
    }
}

export {NoteBreadCrumbCollapse};