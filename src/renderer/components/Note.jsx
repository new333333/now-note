import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Button, Select, Tooltip } from 'antd';
import { HomeOutlined, DownOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';
import {NotePriority} from './NotePriority.jsx';
import {NoteBacklinks} from './NoteBacklinks.jsx';
import {NoteTags} from './NoteTags.jsx';
import { Editor } from '@tinymce/tinymce-react';
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';
import {ModalFilterByParentNotes} from './ModalFilterByParentNotes.jsx';

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
            this.props.setDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
        }
    }

    onClickEditor(e, editor) {
        // console.log("onClickEditor(e, editor)", e, editor);

        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.gotoNote) {
            // console.log("activateNode", e.srcElement.dataset.gotoNote);
            this.props.setDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
            this.props.openNoteDetails(e.srcElement.dataset.gotoNote);
        }
        
        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.n3assetKey) {
            // console.log("open attachment in ew tab", e.srcElement.href);
            this.props.setDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
            this.props.dataSource.downloadAttachment(e.srcElement.href);
        }

    }

    componentWillUnmount() {
        // console.log("componentWillUnmount(value, editor)", value);
        if (this.inputRefTinyMCE.current) {
            this.props.setDescription(this.props.note.key, this.inputRefTinyMCE.current.getContent());
        }
    }

    handleSetFilter(event) {
        if (event.key == "filterByParentNote") {
            this.modalFilterByParentNotesRef.current.open();
        }
    }

    setupTinyMce(editor) {

        let self = this;

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
                        editor.insertContent("<span class='nn-link' data-n3link-node='" + key +"' contenteditable='false'>#" + path + "</span> ");
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

    render() {

        if (this.inputRefTinyMCE.current) {
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
            <>
                <div style={{padding: "5px"}}>
                    <div>
                        {
                            this.props.note &&
                            <NoteBreadCrumb parents={this.props.note.parents} openNoteDetails={this.props.openNoteDetails} />}
                    </div>
                    <div>
                        {this.props.note ?
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <div style={{display: "flex", alignItems: "center" }}>
                                {
                                    this.props.note.type == "task" &&
                                        <div style={{width: "27px", margin: "0 8px"}}>
                                            <Tooltip title={"Mark as" + (this.props.note.done ? " NOT" : "") + " Done"}>
                                                <Checkbox shape="round"  
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
                            <div>
                                    <span style={{marginRight: "5px"}}>
                                        This&nbsp;is&nbsp;a&nbsp;
                                        <Tooltip title={"Change to " + this.props.getOtherNoteTypeLabel(this.props.note.type)}><a href="#" onClick={(event)=> this.handleChangeType()}><strong>{this.props.getNoteTypeLabel(this.props.note.type)}</strong></a></Tooltip>
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
                            {/*
                            <div>
                                <Space>

                                    <Dropdown overlay={filterMenu}>
                                        <Button>
                                            <Space>
                                                Filter {activeFiltersCount > 0 ? <Typography.Text mark>{activeFiltersCount}</Typography.Text> : ""}
                                                <DownOutlined />
                                            </Space>
                                        </Button>
                                    </Dropdown>


                                </Space>
                            </div>
                            */}
                            <div>
                                <Editor
                                    onInit={(evt, editor) => this.inputRefTinyMCE.current = editor}
                                    initialValue={this.props.note.description}
                                    onBlur={this.onBlurEditor}
                                    onClick={this.onClickEditor}
                                    init={{
                                        setup: this.setupTinyMce,
                                        skin: false,
                                        // menubar: false,
                                        // inline: true,
                                        content_css: false,
                                        content_style: [contentCss, contentUiCss, " .nn-link {color: blue; font-size: 20px; } "].join('\n'),
                                        toolbar_sticky: true,
                                        toolbar_sticky_offset: 0,
                                        height: 50,
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
                                        toolbar: "undo redo | blocks | " +
                                            "bold italic underline strikethrough  backcolor | alignleft aligncenter " +
                                            "alignright alignjustify | bullist numlist outdent indent | " +
                                            "removeformat | code",
                                    }}
                                />
                            </div>
                        </Space> :
                        <div>no note selected</div>}
                    </div>
                    <div>
                        {
                            this.props.note &&
                            <NoteBacklinks 
                                noteKey={this.props.note.key}
                                backlinks={this.props.note.backlinks}
                                openNoteDetails={this.props.openNoteDetails}
                                />
                        }
                    </div>

                </div>
                <ModalFilterByParentNotes 
                    ref={this.modalFilterByParentNotesRef}
                    dataSource={this.props.dataSource}

                    addParentNotesFilter={this.addParentNotesFilter}
                    filterByParentNotesKey={this.props.filterByParentNotesKey}
                />
            </>
        );
    }
}

export {Note};