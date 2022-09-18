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

    setDone() {
        this.props.setDone();
    }

    setType() {
        console.log(" setType this.props.note.type", this.props.note.type);
        let self = this;
        let foundTypeIdx = this.props.noteTypes.findIndex(function(noteType) {
            return noteType.key === self.props.note.type;
        });
        console.log(" setType foundTypeIdx", foundTypeIdx);

        console.log(" setType this.props.noteTypes", this.props.noteTypes);
        this.props.setType( this.props.noteTypes[foundTypeIdx == 0 ? 1 : 0].key );


    }

    setTitle(event) {
        this.props.setTitle( event.target.value );
    }

    getNoteTypeLabel(type) {
        let foundType =  this.props.noteTypes.find(function(noteType) {
            return noteType.key === type;
        });
        return foundType.label;
    }

    handleChangeTitle(event) {
        this.props.handleChangeTitle( event.target.value );
    }

    handleChangePriority(val) {
        this.props.handleChangePriority( val );
    }

    render() {

        // console.log("Note render done", this.props.note);

        let noteTypeMenu = (
            <Menu onClick={(event)=> this.setType(event)}
              items={this.props.noteTypes}
            />
        );

        return (
            <div>
                {this.props.note ?
                <div>
                    <div style={{display: "flex" }}>
                        {this.props.note.type == "task" ?
                            
                            <div>
                                <Checkbox shape="round" bigger 
                                color="success" style={{ display: "inline-block" }} 
                                checked={this.props.note.done} 
                                onChange={(event)=> this.setDone(event)} /></div> :
                            ""
                        }
                        <div style={{flexBasis: "100%" }}>
                            <Input 
                                size="large" 
                                value={this.props.note.title} 
                                onChange={(event)=> this.handleChangeTitle(event)} 
                                onBlur={(event)=> this.setTitle(event)} />
                        </div>
                    </div>
                    <div>
                        <div>
                            
                                <Space>
                                    <a href="#" onClick={(event)=> this.setType()} ><strong>{this.getNoteTypeLabel(this.props.note.type)}</strong></a>
                                </Space>
                            
                        </div>
                        <div>
                            Priority: 
                            <NotePriority 
                                note={this.props.note} 
                                setPriority={this.props.setPriority} 
                                handleChangePriority={this.props.handleChangePriority} 
                                priority={this.props.priority}
                                />
                        </div>
                        <div>
                            <NoteTags 
                                addTag={this.props.addTag} 
                                tags={this.props.note.tags || []}/>
                        </div>
                    </div>
                    Note details: {this.props.note.key}
                </div> :
                <div>no note selected</div>}

            </div>
        );
    }
}

export {Note};