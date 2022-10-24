import React from 'react';

import { Input, Space, Divider, List, Typography, Button, Dropdown, Menu, Modal, AutoComplete } from 'antd';
import { DownOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
const { Search } = Input;
import { grey } from '@ant-design/colors';
import {NoteBreadCrumb} from './NoteBreadCrumb.jsx';

class ModalFilterByParentNotes extends React.Component {

    constructor() {
        super();
        this.inputRefAutoCompleteParentNote = React.createRef();
        this.state = {
            isModalFilterByParentNoteOpen: false,
            valueAutoComplete: "",
            optionsAutoComplete: [],
            selectedNotes: [],
        };
        this.handleCancelModalFilterByParentNote = this.handleCancelModalFilterByParentNote.bind(this);
        this.handleOkModalFilterByParentNote = this.handleOkModalFilterByParentNote.bind(this);
        this.onChangeAutoComplete = this.onChangeAutoComplete.bind(this);
        this.onSearchAutoComplete = this.onSearchAutoComplete.bind(this);
        this.onSelectAutoComplete = this.onSelectAutoComplete.bind(this);
        this.removeNote = this.removeNote.bind(this);
    }

    open() {
        this.setState({
            isModalFilterByParentNoteOpen: true,
        });
    }

    async onSearchAutoComplete(searchText) {
        let searchResults = await this.props.dataSource.search(searchText, -1, false);

        console.log("onSearchAutoComplete", searchResults);
        let options = searchResults.map(function(note) {
			return {
                label: (<><strong>{note.title.length > 20 ? `${note.title.slice(0, 20)}...` : note.title}</strong> {note.path}</>),
                value: note.key,
            };
		});

        this.setState({
            optionsAutoComplete: options
        });
    }

    async onSelectAutoComplete(noteKey) {
        console.log("onSelectAutoComplete", noteKey);
        let self = this;

        this.props.dataSource.getParents(noteKey).then(function(selectedNote) {
            console.log("onSelectAutoComplete selectedNote", selectedNote);

            self.setState((previousState) => {
                let selectedNotes = JSON.parse(JSON.stringify(previousState.selectedNotes));

                selectedNotes.push({
                    key: noteKey,
                    path: selectedNote,
                });
    
                return {
                    valueAutoComplete: "",
                    optionsAutoComplete: [],
                    selectedNotes: selectedNotes
                };
            });
    
                
        })


    }

    onChangeAutoComplete(data) {
        this.setState({
            valueAutoComplete: data
        });
    }

    handleCancelModalFilterByParentNote(event) {
        this.setState({
            isModalFilterByParentNoteOpen: false
        });
    }

    handleOkModalFilterByParentNote(event) {
        this.setState({
            isModalFilterByParentNoteOpen: false
        });


        let selectedNotesKey = this.state.selectedNotes.map(selectedNote => selectedNote.key);


        this.props.addParentNotesFilter(selectedNotesKey);
    }

    componentDidUpdate() {
        if (this.inputRefAutoCompleteParentNote.current) {
            this.inputRefAutoCompleteParentNote.current.focus();
        }
    }

    removeNote(key) {
        console.log("removeNote", key);

        this.setState((previousState) => {
           let selectedNotes = previousState.selectedNotes.filter(note => note.key != key);

            return {
                selectedNotes: selectedNotes
            };
        });

    }

    render() {
        return (
            <>
                <Modal title="Choose parent notes" visible={this.state.isModalFilterByParentNoteOpen} onOk={this.handleOkModalFilterByParentNote} onCancel={this.handleCancelModalFilterByParentNote}>
                    <AutoComplete
                        dropdownMatchSelectWidth={false}
                        style={{ width: '100%' }} 
                        ref={this.inputRefAutoCompleteParentNote}
                        defaultActiveFirstOption={true}
                        value={this.state.valueAutoComplete}
                        onChange={this.onChangeAutoComplete}
                        options={this.state.optionsAutoComplete}
                        onSearch={this.onSearchAutoComplete}
                        onSelect={this.onSelectAutoComplete}
                    >
                        <Input.Search size="small" placeholder="" />
                    </AutoComplete>

                    <List
                        bordered
                        dataSource={this.state.selectedNotes}
                        locale={{emptyText: "No notes selected"}}
                        renderItem={selectedNote => (
                            <List.Item
                                actions={[<a key="list-loadmore-edit"><DeleteOutlined onClick={(event)=> this.removeNote(selectedNote.key)} /></a>]}
                            >
                                <span>
                                    {selectedNote.path &&
                                        (selectedNote.path.map((note, i) => <span key={note.key}><span>{note.title}</span> {i < selectedNote.path.length - 1 ? <span> / </span> : <></>}  </span>))
                                    }
                                </span>
                            </List.Item>
                        )}
                    />

                </Modal>
            </>
        );
    }
}

export {ModalFilterByParentNotes};