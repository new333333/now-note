import React from 'react';
import { Dropdown, Menu, Divider, Checkbox, Tooltip, Collapse, Typography, Button } from 'antd';
import Icon, { UnorderedListOutlined, PlusOutlined, DeleteFilled, EllipsisOutlined } from '@ant-design/icons';
import {NotePriority} from './NotePriority.jsx';
import {NoteBacklinks} from './NoteBacklinks.jsx';
import {NoteTags} from './NoteTags.jsx';
import { Editor } from '@tinymce/tinymce-react';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';
const { Panel } = Collapse;
const { Text, Link, Paragraph } = Typography;


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
import { replace } from 'lodash';


const TreeSvg = () => (
    <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path fill="none" d="M0 0H24V24H0z"/>
            <path d="M10 2c.552 0 1 .448 1 1v4c0 .552-.448 1-1 1H8v2h5V9c0-.552.448-1 1-1h6c.552 0 1 .448 1 1v4c0 .552-.448 1-1 1h-6c-.552 0-1-.448-1-1v-1H8v6h5v-1c0-.552.448-1 1-1h6c.552 0 1 .448 1 1v4c0 .552-.448 1-1 1h-6c-.552 0-1-.448-1-1v-1H7c-.552 0-1-.448-1-1V8H4c-.552 0-1-.448-1-1V3c0-.552.448-1 1-1h6zm9 16h-4v2h4v-2zm0-8h-4v2h4v-2zM9 4H5v2h4V4z"/>
        </g>
    </svg>
);

const TreeIcon = (props) => <Icon component={TreeSvg} {...props} />;

class Note extends React.Component {

    constructor(props) {
        super(props);
        
        this.tinyMCEDomRef = React.createRef();
        this.titleDomRef = React.createRef();

        this.handleChangeTitle = this.handleChangeTitle.bind(this);
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleNoteMenu = this.handleNoteMenu.bind(this);

        this.onBlurEditor = this.onBlurEditor.bind(this);
        this.onClickEditor = this.onClickEditor.bind(this);
        this.setupTinyMce = this.setupTinyMce.bind(this);
    }

    async saveChanges() {
        if (this.tinyMCEDomRef.current && this.tinyMCEDomRef.current.isDirty()) {
            await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
        }
        if (this.titleDomRef.current) {
            await this.props.saveTitle(this.props.note.key, this.titleDomRef.current.input.value);
        }
    }

    handleChangeDone(event) {
        this.props.handleChangeDone(this.props.note.key, event.target.checked);
    }

    handleChangeType() {
        let self = this;
        let foundTypeIdx = this.props.noteTypes.findIndex(function(noteType) {
            return noteType.key === self.props.note.type;
        });
        this.props.handleChangeType(this.props.note.key, this.props.noteTypes[foundTypeIdx == 0 ? 1 : 0].key );
    }

    handleChangeTitle(value) {
        this.props.handleChangeTitle(this.props.note.key, value);
    }


    async saveTitle(event) {
        console.log(">>>>>>>>>>>> saveTitle on blur ");
        let title = event.target.value;
        title = title.replaceAll("/", "");
        await this.props.saveTitle(this.props.note.key, title);
    }
    
    async onBlurEditor(value, editor) {
        console.log("onBlurEditor(value, editor), isDirty", value, this.tinyMCEDomRef.current.isDirty());
        if (this.tinyMCEDomRef.current && this.tinyMCEDomRef.current.isDirty()) {
            await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
        }
    }

    async onClickEditor(e, editor) {
        console.log("onClickEditor(e, editor) isDirty", e, editor, this.tinyMCEDomRef.current.isDirty());

        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.gotoNote) {
            // console.log("activateNode", e.srcElement.dataset.gotoNote);
            // TODO: check dirty?
            if (this.tinyMCEDomRef.current.isDirty()) {
                await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
            }
            await this.props.openNoteInTreeAndDetails(e.srcElement.dataset.gotoNote);
        }
        
        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.n3assetKey) {
            // TODO: check dirty?
            
            if (e.srcElement.tagName == "A") {
                // TODO: download by assetKey, don't set HREF any more by loading description
                if (this.tinyMCEDomRef.current.isDirty()) {
                    this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
                }
                this.props.dataSource.downloadAttachment(e.srcElement.href);
            } else if (e.srcElement.tagName == "IMG") {
                // console.log("TODO: download image");
                // if (this.tinyMCEDomRef.current.isDirty()) {
                //  this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
                // }
            }
            
        }

    }

    componentWillUnmount() {
        // console.log("componentWillUnmount(value, editor)", value);
        if (this.tinyMCEDomRef.current && this.props.note) {
            if (this.tinyMCEDomRef.current.isDirty()) {
                this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
            }
        }
    }

    setupTinyMce(editor) {

        let self = this;

        editor.on("drop", function(event, a, b, c) {
            console.log("drop", event, a, b, c);
        });

        editor.on("SetContent", function(event, a, b, c) {
            // console.log("SetContent, event, getContent", event, self.tinyMCEDomRef.current ? self.tinyMCEDomRef.current.getContent() : undefined);

            if (event.paste) {
                // it's not dirty yet, save it!
                self.props.handleChangeDescription(self.props.note.key, self.tinyMCEDomRef.current.getContent());
            }

        });

        editor.ui.registry.addAutocompleter("specialchars", {
            ch: '#',
            minChars: 0,
            columns: 1,
            onAction: function(autocompleteApi, rng, key) {
                editor.selection.setRng(rng);

                self.props.dataSource.getNote(key).then(function(linkToNote) {

                    // console.log("getNote", key, linkToNote);
                    self.props.dataSource.getParents(key).then(function(parents) {
                        let path = "";
                        let sep = "";
                        if (parents) {
                            parents.forEach(function(parentNote) {
                                path = `${path}${sep}<a href='#${parentNote.key}' data-goto-note='${parentNote.key}'>${parentNote.title}</a>`;
                                sep = " / ";
                            });
                        }
                        editor.insertContent("<span class='nn-link' data-nnlink-node='" + key +"' contenteditable='false'>#" + path + "</span> ");
                        autocompleteApi.hide();
                    });
                });
                // TODO: on reject ? no note found or other errors...
            },
            fetch: function(pattern) {
                // console.log("addAutocompleter fetch pattern", pattern);
                return new Promise(function(resolve) {
                    let searchResults = [];

                    self.props.dataSource.search(pattern, 20, false).then(function(searchResults) {
                        showAutocomplete(searchResults.results, resolve);
                    });

                    function showAutocomplete(searchResults, resolve) {
                        // console.log("addAutocompleter searchResults", searchResults);

                        if (searchResults.length > 0) {
                            let results = searchResults.map(function(searchResult) {
                                return {
                                    type: 'cardmenuitem',
                                    value: searchResult.key,
                                    label: searchResult.path ? searchResult.path + " / " + searchResult.title : searchResult.title,
                                    items: [
                                        {
                                            type: 'cardcontainer',
                                            direction: 'vertical',
                                            items: [
                                                {
                                                    type: 'cardtext',
                                                    text: searchResult.path ? searchResult.path + " / " + searchResult.title : searchResult.title,
                                                    name: 'char_name'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            });
                            resolve(results);
                        } else {
                            resolve([{
                                type: "cardmenuitem",
                                value: "value",
                                label: "label",
                                items: [
                                    {
                                        type: "cardcontainer",
                                        direction: "vertical",
                                        items: [
                                            {
                                                type: "cardtext",
                                                text: "New note: " + pattern,
                                                name: "char_name"
                                            }
                                        ]
                                    }
                                ]
                            }]);
                        }
                    }
                    
                });
            }
        });
    }


    async addNote(key) {
        // console.log("addNote, key=", key);
        let newNote = await this.props.addNote(key);
        this.props.openNoteInTreeAndDetails(newNote.key);
    }

    async delete(key) {
        console.log("delete, key=", key);
        this.props.delete(key);
    }

    async handleNoteMenu(event) {
        console.log("handleNoteMenu, event=", event);

        if (event.key == "add_note") {
            this.addNote(this.props.note.key)
        } else if (event.key == "open_tree") {
            this.props.openNoteInTree(this.props.note.key);
        } else if (event.key == "open_list") {
            this.props.openNoteInList(this.props.note.key);
        } else if (event.key == "delete") {
            this.delete(this.props.note.key);
        } else if (event.key == "restore") {
            this.props.restore(this.props.note.key);
        }
    }

    render() {

        let noteMenu = undefined;
        if (this.props.note) {
            let noteMenuItems = [];
            if (!this.props.note.trash) { 
                noteMenuItems.push({
                    key: 'add_note',
                    label: "Add note",
                    icon: <PlusOutlined />,
                });
            }
            noteMenuItems.push({
                key: 'open_tree',
                label: "Open tree",
                icon: <TreeIcon />,
            });
            noteMenuItems.push({
                key: 'open_list',
                label: "Open as list",
                icon: <UnorderedListOutlined />,
            });
            noteMenuItems.push({
                key: 'delete',
                label: this.props.note.trash ? "Delete Permanently" : "Move To Trash",
                icon: <DeleteFilled />,
            });
            if (this.props.note.trash) { 
                noteMenuItems.push({
                    key: 'restore',
                    label: "Restore",
                });
            }

            noteMenu = (
                <Menu
                    onClick={(event)=> this.handleNoteMenu(event)}
                    items={noteMenuItems}
                />
            );
        }

        if (this.tinyMCEDomRef.current && this.props.note) {
            this.tinyMCEDomRef.current.setContent(this.props.note.description);
        }

        return (
            <div style={{backgroundColor: "#fafafa", padding: "5px", display: "flex", flexDirection: "column", height: "100%"}}>
                {   
                    !this.props.note && 
                    <Text type="secondary">No note selected.</Text>
                }

                {
                    this.props.note && 
                    <>
                        <div>
                            <NoteBreadCrumbCollapse parents={this.props.note.parents} handleClickNote={this.props.openNoteInTreeAndDetails} />
                        </div>
                        <Divider style={{margin: "5px 0"}} />
                        <div style={{display: "flex", alignItems: "center" }}>
                            {
                                this.props.note.type == "task" &&
                                    <div style={{margin: "0 5px"}}>
                                        <Tooltip placement="bottom" title={"Mark as" + (this.props.note.done ? " NOT" : "") + " Done"}>
                                            <Checkbox  
                                                disabled={this.props.note.trash}
                                                checked={this.props.note.done} 
                                                onChange={(event)=> this.handleChangeDone(event)} />
                                        </Tooltip>
                                    </div>
                            }
                            <div style={{flexBasis: "100%" }}>
                                {
                                    this.props.note.trash &&
                                    <Paragraph strong style={{marginBottom: 0}}>{this.props.note.title}</Paragraph>
                                }
                                {
                                    !this.props.note.trash &&
                                    <Paragraph strong style={{marginBottom: 0}}
                                        editable={{
                                            tooltip: "click to edit",
                                            onChange: this.handleChangeTitle,
                                            triggerType: ["icon", "text"],
                                            autoSize: { maxRows: 5 }
                                        }}
                                    >{this.props.note.title}</Paragraph>
                                }
                            </div>
                            <div>
                                <Dropdown overlay={noteMenu}>
                                    <Button shape="circle" icon={<EllipsisOutlined />} size="small" />
                                </Dropdown>
                            </div>
                        </div>
                        <Divider style={{margin: "5px 0"}} />
                        <div style={{padding: "5px 0"}}>
                                <span style={{marginRight: "5px"}}>
                                    {
                                        !this.props.note.trash &&
                                        <Tooltip placement="bottom" title={"Change to " + this.props.getOtherNoteTypeLabel(this.props.note.type)}>
                                            <Link strong onClick={(event)=> this.handleChangeType()}>
                                                {this.props.getNoteTypeLabel(this.props.note.type)}
                                            </Link>
                                        </Tooltip>
                                    }
                                    {
                                        this.props.note.trash &&
                                        <Text strong>{this.props.getNoteTypeLabel(this.props.note.type)}</Text>
                                    }
                                </span>
                                <NotePriority 
                                    trash={this.props.note.trash}
                                    noteKey={this.props.note.key}
                                    priority={this.props.note.priority}
                                    handleChangePriority={this.props.handleChangePriority} 
                                    priorityStat={this.props.priorityStat}
                                    />
                                <NoteTags 
                                    trash={this.props.note.trash}
                                    dataSource={this.props.dataSource}

                                    noteKey={this.props.note.key}
                                    tags={this.props.note.tags || []}

                                    addTag={this.props.addTag} 
                                    deleteTag={this.props.deleteTag}
                                    />
                        </div>
                        <Divider style={{margin: "5px 0"}} />
                        <div style={{flex: 1}}>
                            <Editor
                                onInit={(evt, editor) => this.tinyMCEDomRef.current = editor}
                                initialValue={this.props.note.description}
                                onBlur={this.onBlurEditor}
                                onClick={this.onClickEditor}
                                disabled={this.props.note.trash}
                                init={{
                                    text_patterns: false,
                                    setup: this.setupTinyMce,
                                    skin: false,
                                    content_css: false,
                                    content_style: [contentCss, contentUiCss, " .nn-link {color: blue; } "].join('\n'),
                                    height: "100%",
                                    inline_boundaries: false,
                                    powerpaste_word_import: "clean",
                                    powerpaste_html_import: "clean",
                                    block_unsupported_drop: false,
                                    menubar: false,
                                    plugins: [
                                        "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                                        "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                                        "insertdatetime", "media", "table", "code", "help", "wordcount"
                                    ],
                                    toolbar: "undo redo | blocks | " +
                                        "bold italic underline strikethrough  backcolor | alignleft aligncenter " +
                                        "alignright alignjustify | bullist numlist outdent indent | " +
                                        "removeformat | code",
                                    toolbar_mode: 'sliding'
                                }}
                            />
                        </div>
                        <div>
                            <NoteBacklinks 
                                noteKey={this.props.note.key}
                                backlinks={this.props.note.backlinks}
                                handleClickNote={this.props.openNoteInTreeAndDetails}
                            />
                        </div>

                    </>
                }
            </div>
        );
    }
}

export {Note};