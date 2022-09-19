import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select } from 'antd';
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
                    <div>
                        <Editor
                            onInit={(evt, editor) => this.inputRefTinyMCE.current = editor}
                            initialValue={this.props.description}
                            onBlur={this.onBlur}
                            init={{
                                skin: false,
                                content_css: false,
                                content_style: [contentCss, contentUiCss].join('\n'),
                                height: 500,
                                toolbar_sticky: true,
                                toolbar_sticky_offset: 0,
                                min_height: 400,
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
                </div> :
                <div>no note selected</div>}

            </div>
        );
    }
}

export {Note};