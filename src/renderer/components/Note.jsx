import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';
import {NotePriority} from './NotePriority.jsx';
import {NoteTags} from './NoteTags.jsx';

class Note extends React.Component {

    constructor() {
        super();
        this.setType = this.setType.bind(this);
    }

    setDone(event) {
        this.props.setDone(this.props.noteKey, event.target.checked);
    }

    setType() {
        let self = this;
        let foundTypeIdx = this.props.noteTypes.findIndex(function(noteType) {
            return noteType.key === self.props.type;
        });
        this.props.setType(this.props.noteKey, this.props.noteTypes[foundTypeIdx == 0 ? 1 : 0].key );
    }

    setTitle(event) {
        this.props.setTitle(this.props.noteKey, event.target.value );
    }

    handleChangeTitle(event) {
        this.props.handleChangeTitle(this.props.noteKey, event.target.value );
    }

    getNoteTypeLabel(type) {
        let foundType =  this.props.noteTypes.find(function(noteType) {
            return noteType.key === type;
        });
        if (!foundType) {
            throw new Error(`Unknown note type: '${type}'.`);
        }
        return foundType.label;
    }


    render() {

        console.log("Note render done", this.props.noteKey);

        let noteTypeMenu = (
            <Menu onClick={(event)=> this.setType(event)}
              items={this.props.noteTypes}
            />
        );

        return (
            <div>
                {this.props.noteKey ?
                <div>
                    <div style={{display: "flex" }}>
                        {this.props.type == "task" ?
                            
                            <div>
                                <Checkbox shape="round" bigger 
                                    color="success" style={{ display: "inline-block" }} 
                                    checked={this.props.done} 
                                    onChange={(event)=> this.setDone(event)} /></div> :
                            ""
                        }
                        <div style={{flexBasis: "100%" }}>
                            <Input 
                                size="large" 
                                value={this.props.title} 
                                onChange={(event)=> this.handleChangeTitle(event)} 
                                onBlur={(event)=> this.setTitle(event)} />
                        </div>
                    </div>
                    <div>
                        <div>
                            
                            <Space>
                                <a href="#" onClick={(event)=> this.setType()} ><strong>{this.getNoteTypeLabel(this.props.type)}</strong></a>
                            </Space>
                            
                        </div>
                        <div>
                            <NotePriority 
                                noteKey={this.props.noteKey}
                                priority={this.props.priority}
                                setPriority={this.props.setPriority} 
                                priorityStat={this.props.priorityStat}
                                />
                        </div>
                        <div>
                            <NoteTags 
                                noteKey={this.props.noteKey}
                                tags={this.props.tags || []}

                                addTag={this.props.addTag} 
                                deleteTag={this.props.deleteTag}
                                />
                        </div>
                    </div>
                    Note details: {this.props.noteKey}
                </div> :
                <div>no note selected</div>}

            </div>
        );
    }
}

export {Note};