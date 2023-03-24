import React from 'react';
import {Editor} from '@tinymce/tinymce-react';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
import contentNNCustomCss from '!!raw-loader!../css/tinymce.css';
import { replace } from 'lodash';

class NoteDescription extends React.Component {

    constructor(props) {
        super(props);

        this.tinyMCEDomRef = React.createRef();

        this.onBlurEditor = this.onBlurEditor.bind(this);
        this.onClickEditor = this.onClickEditor.bind(this);
        this.setupTinyMce = this.setupTinyMce.bind(this);
    }

    async saveChanges() {
        if (this.tinyMCEDomRef.current && this.tinyMCEDomRef.current.isDirty()) {
            await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
        }
    }

    async onBlurEditor(value, editor) {
        if (this.tinyMCEDomRef.current && this.tinyMCEDomRef.current.isDirty()) {
            await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
        }
    }

    async onClickEditor(e, editor) {
        if (e.srcElement &&  e.srcElement.dataset && e.srcElement.dataset.gotoNote) {
            // console.log("activateNode", e.srcElement.dataset.gotoNote);
            // TODO: check dirty?
            if (this.tinyMCEDomRef.current.isDirty()) {
                await this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
            }
            await this.props.openNoteInTreeAndDetails(e.srcElement.dataset.gotoNote);
        }
        
        if (e.srcElement) {
            
            if (e.srcElement.tagName == "A" && e.srcElement.href && e.srcElement.href.startsWith("nn-asset:")) {
                window.open(e.srcElement.href, '_blank');
            }
            
            if (e.srcElement.tagName == "IMG") {
                // console.log("TODO: show big image");
                // if (this.tinyMCEDomRef.current.isDirty()) {
                //  this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
                // }
            }
            
        }

    }

    setupTinyMce(editor) {

        let self = this;

        editor.on("drop", function(event, a, b, c) {
            console.log("drop", event, a, b, c);
        });

        editor.on("keydown", function(e) {
            if (e.key === "s" && e.ctrlKey) {
                self.saveChanges();
            }
        });

        editor.on("SetContent", function(event, a, b, c) {
            // console.log("SetContent, event, getContent", event, self.tinyMCEDomRef.current ? self.tinyMCEDomRef.current.getContent() : undefined);

            if (event.paste) {
                // don't do it now, it moves cursor to the top after paste in editor
                // self.props.handleChangeDescription(self.props.note.key, self.tinyMCEDomRef.current.getContent());
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
                        }
                    }
                    
                });
            }
        });
    }

    render() {
        if (this.tinyMCEDomRef.current && this.props.note) {
            this.tinyMCEDomRef.current.setContent(this.props.note.description);
        }

        return (
            <>
            <ReactQuill  />
                {/*<Editor
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
                        content_style: [contentCss, contentUiCss, contentNNCustomCss].join('\n'),
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
                />*/}
            </>
        );
    }
}

export {NoteDescription};