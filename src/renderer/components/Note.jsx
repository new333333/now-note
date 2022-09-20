import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select, Tooltip } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';
import {NotePriority} from './NotePriority.jsx';
import {NoteTags} from './NoteTags.jsx';
import { Editor } from '@tinymce/tinymce-react';


import tinymce from 'tinymce/tinymce';

// Theme
import 'tinymce/themes/silver';
// Toolbar icons
import 'tinymce/icons/default';
// Editor styles
import 'tinymce/skins/ui/oxide/skin.min.css';

import 'tinymce/models/dom';

// importing the plugin js.
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/table';
import 'tinymce/plugins/template';
import 'tinymce/plugins/help';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/autoresize';



// Content styles, including inline UI like fake cursors
/* eslint import/no-webpack-loader-syntax: off */
import contentCss from '!!raw-loader!tinymce/skins/content/default/content.min.css';
import contentUiCss from '!!raw-loader!tinymce/skins/ui/oxide/content.min.css';


class Note extends React.Component {

    constructor() {
        super();
        
        this.inputRefTinyMCE = React.createRef();

        this.setType = this.setType.bind(this);
        this.onBlur = this.onBlur.bind(this);
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

    getOtherNoteTypeLabel(type) {
        let otherType =  this.props.noteTypes.find(function(noteType) {
            return noteType.key !== type;
        });
        return otherType.label;
    }
    

    onBlur(value, editor) {
        console.log("onBlur(value, editor)", value);
        if (this.inputRefTinyMCE.current) {
            this.props.setDescription(this.props.noteKey, this.inputRefTinyMCE.current.getContent());
        }
    }

    componentWillUnmount() {
        console.log("componentWillUnmount(value, editor)", value);
        if (this.inputRefTinyMCE.current) {
            this.props.setDescription(this.props.noteKey, this.inputRefTinyMCE.current.getContent());
        }
    }

    render() {

        // console.log("Note render done", this.props.noteKey);

        if (this.inputRefTinyMCE.current) {
            this.inputRefTinyMCE.current.setContent(this.props.description);
        }

        return (
            <div style={{padding: "5px"}}>
                <div>
                    {this.props.noteKey ?
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <div style={{display: "flex", alignItems: "center" }}>
                            {
                                this.props.type == "task" &&
                                    <div style={{width: "27px", margin: "0 8px"}}>
                                        <Tooltip title={"Mark as" + (this.props.done ? " NOT" : "") + " Done"}>
                                            <Checkbox shape="round"  
                                                color="success" 
                                                style={{ 
                                                    display: "inline-block",
                                                    fontSize: 25  }} 
                                                checked={this.props.done} 
                                                onChange={(event)=> this.setDone(event)} />
                                        </Tooltip>
                                    </div>
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
                            <Space>
                                <div>
                                    This is a&nbsp; 
                                    <Tooltip title={"Change to " + this.getOtherNoteTypeLabel(this.props.type)}>
                                        <a href="#" onClick={(event)=> this.setType()}><strong>{this.getNoteTypeLabel(this.props.type)}</strong></a>
                                    </Tooltip>
                                </div>
                                <NotePriority 
                                    noteKey={this.props.noteKey}
                                    priority={this.props.priority}
                                    setPriority={this.props.setPriority} 
                                    priorityStat={this.props.priorityStat}
                                    />
                            </Space>
                        </div>
                        <div>
                            <NoteTags 
                                noteKey={this.props.noteKey}
                                tags={this.props.tags || []}

                                addTag={this.props.addTag} 
                                deleteTag={this.props.deleteTag}
                                />
                        </div>
                        <div>
                            <Editor
                                onInit={(evt, editor) => this.inputRefTinyMCE.current = editor}
                                initialValue={this.props.description}
                                onBlur={this.onBlur}
                                init={{
                                    skin: false,
                                    content_css: false,
                                    content_style: [contentCss, contentUiCss].join('\n'),
                                    toolbar_sticky: true,
                                    toolbar_sticky_offset: 0,
                                    min_height: 100,
                                    inline_boundaries: false,
                                    powerpaste_word_import: "clean",
                                    powerpaste_html_import: "clean",
                                    block_unsupported_drop: false,
                                    menubar: false,
                                    plugins: [
                                        "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                                        "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                                        "insertdatetime", "media", "table", "code", "help", "wordcount",
                                        "autoresize"
                                    ],
                                    toolbar: 'undo redo | formatselect | ' +
                                        'bold italic backcolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                }}
                            />
                        </div>
                    </Space> :
                    <div>no note selected</div>}
                </div>
                <div>
                    TODO backlinks...
                </div>

            </div>
        );
    }
}

export {Note};