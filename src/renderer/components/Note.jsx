import React from 'react';
import { Menu, Space, Input, Tooltip, Collapse } from 'antd';
import Icon, { PlusSquareOutlined, DeleteFilled } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';
import {NotePriority} from './NotePriority.jsx';
import {NoteBacklinks} from './NoteBacklinks.jsx';
import {NoteTags} from './NoteTags.jsx';
import { Editor } from '@tinymce/tinymce-react';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';
const { Panel } = Collapse;

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

    constructor() {
        super();
        
        this.inputRefTinyMCE = React.createRef();
        this.modalFilterByParentNotesRef = React.createRef();

        this.handleChangeType = this.handleChangeType.bind(this);
        this.onBlurEditor = this.onBlurEditor.bind(this);
        this.onClickEditor = this.onClickEditor.bind(this);
        this.setupTinyMce = this.setupTinyMce.bind(this);
        this.handleSetFilter = this.handleSetFilter.bind(this);
        this.addParentNotesFilter = this.addParentNotesFilter.bind(this);
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

    handleChangeTitle(event) {
        let title = event.target.value;
        title = title.replaceAll("/", "");
        this.props.handleChangeTitle(this.props.note.key, title);
    }

    onBlurEditor(value, editor) {
        // console.log("onBlurEditor(value, editor)", value);
        if (this.inputRefTinyMCE.current) {
            // TODO: check dirty?
            this.props.handleChangeDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
        }
    }

    async onClickEditor(e, editor) {
        // console.log("onClickEditor(e, editor)", e, editor);

        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.gotoNote) {
            // console.log("activateNode", e.srcElement.dataset.gotoNote);
            // TODO: check dirty?
            await this.props.handleChangeDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
            await this.props.openNoteDetails(e.srcElement.dataset.gotoNote);
        }
        
        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.n3assetKey) {
            // TODO: check dirty?
            this.props.handleChangeDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
            if (e.srcElement.tagName == "A") {
                // TODO: download by assetKey, don't set HREF any more by loading description
                this.props.dataSource.downloadAttachment(e.srcElement.href);
            } else if (e.srcElement.tagName == "IMG") {
                // console.log("TODO: download image");
            }
            
        }

    }

    componentWillUnmount() {
        // console.log("componentWillUnmount(value, editor)", value);
        if (this.inputRefTinyMCE.current) {
            // TODO: check dirty?
            this.props.handleChangeDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
        }
    }

    handleSetFilter(event) {
        if (event.key == "filterByParentNote") {
            this.modalFilterByParentNotesRef.current.open();
        }
    }

    setupTinyMce(editor) {

        let self = this;

        editor.on("drop", function(event, a, b, c) {
            console.log("drop", event, a, b, c);
        });

        editor.on("SetContent", function(event, a, b, c) {
            // console.log("SetContent, event, getContent", event, self.inputRefTinyMCE.current ? self.inputRefTinyMCE.current.getContent() : undefined);

            if (event.paste) {
                self.props.handleChangeDescription(self.props.note.key, self.inputRefTinyMCE.current.getContent());
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
                        showAutocomplete(searchResults, resolve);
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

    getFilterMenuItems() {
        let menuItems = [
            {
                label:  <>
                            Add or Edit Filter by Parent Notes
                        </>,
                key: 'filterByParentNote',
            },
        ];

        if (this.props.filterByParentNotesKey && this.props.filterByParentNotesKey.length > 0) {
            menuItems.push({
                type: 'divider',
            });

            menuItems.push({
                label:  <>
                            <Typography.Text strong>Remove Filter by Parent Notes <Typography.Text mark>{this.props.filterByParentNotesKey.length}</Typography.Text></Typography.Text>
                        </>,
                key: 'removeFilterByParentNote',
            });

        }

        return menuItems;
    }

    addParentNotesFilter(keys) {
        // console.log("addParentNotesFilter, keys", keys);
        let self = this;

        this.props.setFilterByParentNotesKey(keys);
        
        this.props.dataSource.search("", -1, false, {parentNotesKey: keys}).then(function(searchResults) {
            self.setState({
                notes: searchResults,
            });
        });

    }

    async addNote(key) {
        // console.log("addNote, key=", key);
        let newNote = await this.props.addNote(key);
        this.props.activateNote(newNote.key);
    }

    async delete(key) {
        console.log("delete, key=", key);
        this.props.delete(key);
    }

    render() {

        if (this.inputRefTinyMCE.current && this.props.note) {
            this.inputRefTinyMCE.current.setContent(this.props.note.description);
        }

        const filterMenu = (
            <Menu
                onClick={(event)=> this.handleSetFilter(event)} 
                items={this.getFilterMenuItems()}
            />
        );
        let activeFiltersCount = 0;

        return (
            <div style={{backgroundColor: "#fafafa", padding: "5px", display: "flex", flexDirection: "column", height: "100%"}}>
                {!this.props.note && 
                    <>
                        no note selected
                    </>
                }

                {this.props.note && 
                    <>
                        <div>
                            <NoteBreadCrumbCollapse parents={this.props.note.parents} openNoteDetails={this.props.activateNote} />
                        </div>
                        <div>
                            <Space direction="horizontal" style={{fontSize: "12px"}}>
                                <Tooltip placement="bottom" title={"Show in tree"}>
                                    <TreeIcon onClick={(event) => this.props.openNoteInTree(this.props.note.key)} />
                                </Tooltip>
                                <Tooltip placement="bottom" title={"Add note"}>
                                    <PlusSquareOutlined onClick={(event) => this.addNote(this.props.note.key)} />
                                </Tooltip>
                                <Tooltip placement="bottom" title={this.props.note.trash ? "Delete Permanently" : "Move To Trash"}>
                                    <DeleteFilled onClick={(event) => this.delete(this.props.note.key)} />
                                </Tooltip>
                            </Space>
                        </div>
                        <div style={{display: "flex", alignItems: "center" }}>
                            {
                                this.props.note.type == "task" &&
                                    <div style={{width: "27px", margin: "0 8px"}}>
                                        <Tooltip placement="bottom" title={"Mark as" + (this.props.note.done ? " NOT" : "") + " Done"}>
                                            <Checkbox shape="round"  
                                                disabled={this.props.note.trash}
                                                color="success" 
                                                style={{ 
                                                    display: "inline-block",
                                                    fontSize: 25  }} 
                                                checked={this.props.note.done} 
                                                onChange={(event)=> this.handleChangeDone(event)} />
                                        </Tooltip>
                                    </div>
                            }
                            <div style={{flexBasis: "100%" }}>
                                <Input 
                                    size="large" 
                                    value={this.props.note.title} 
                                    onChange={(event)=> this.handleChangeTitle(event)} 
                                    onBlur={(event)=> this.handleChangeTitle(event)} />
                            </div>
                        </div>
                        <div style={{padding: "5px 0"}}>
                                <span style={{marginRight: "5px"}}>
                                    <Tooltip placement="bottom" title={"Change to " + this.props.getOtherNoteTypeLabel(this.props.note.type)}><a href="#" onClick={(event)=> this.handleChangeType()}><strong>{this.props.getNoteTypeLabel(this.props.note.type)}</strong></a></Tooltip>
                                </span>
                                <NotePriority 
                                    noteKey={this.props.note.key}
                                    priority={this.props.note.priority}
                                    handleChangePriority={this.props.handleChangePriority} 
                                    priorityStat={this.props.priorityStat}
                                    />
                                <NoteTags 
                                    dataSource={this.props.dataSource}

                                    noteKey={this.props.note.key}
                                    tags={this.props.note.tags || []}

                                    addTag={this.props.addTag} 
                                    deleteTag={this.props.deleteTag}
                                    />
                        </div>
                        <div style={{flex: 1}}>
                            <Editor
                                onInit={(evt, editor) => this.inputRefTinyMCE.current = editor}
                                initialValue={this.props.note.description}
                                onBlur={this.onBlurEditor}
                                onClick={this.onClickEditor}
                                init={{
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
                                }}
                            />
                        </div>
                        <div>
                            <NoteBacklinks 
                            noteKey={this.props.note.key}
                            backlinks={this.props.note.backlinks}
                            openNoteDetails={this.props.openNoteDetails}
                            />
                        </div>

                    </>
                }
            </div>
        );
    }
}

export {Note};