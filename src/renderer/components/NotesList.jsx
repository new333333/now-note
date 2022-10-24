import React from 'react';

import { Input, Space, Divider, List, Typography, Button, Dropdown, Menu, Modal, AutoComplete } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
const { Search } = Input;
import { grey } from '@ant-design/colors';
import {ModalFilterByParentNotes} from './ModalFilterByParentNotes.jsx';
import { Checkbox } from 'pretty-checkbox-react';

class NotesList extends React.Component {

    constructor() {
        super();
        this.state = {
            notes: [],
        };
        this.modalFilterByParentNotesRef = React.createRef();
        this.handleClickNote = this.handleClickNote.bind(this);
        this.handleTypeFilter = this.handleTypeFilter.bind(this);
        this.handleSetFilter = this.handleSetFilter.bind(this);
        this.addParentNotesFilter = this.addParentNotesFilter.bind(this);
    }

    componentDidMount() {
        // this.init();
    }

    init() {
        let self = this;
        console.log("init, this.props.filterByParentNotesKey", this.props.filterByParentNotesKey);
        this.props.dataSource.search("", -1, false, {parentNotesKey: this.props.filterByParentNotesKey}).then(function(searchResults) {
            self.setState({
                notes: searchResults
            });
        });
    }


    addParentNotesFilter(keys) {
        console.log("addParentNotesFilter, keys", keys);
        let self = this;

        this.props.setFilterByParentNotesKey(keys);
        
        this.props.dataSource.search("", -1, false, {parentNotesKey: keys}).then(function(searchResults) {
            self.setState({
                notes: searchResults,
            });
        });

    }


    handleClickNote(key, e) {
        this.props.activateNote(key);

        this.setState({
            activeNoteKey: key,
        });
    }


    setActive(key) {
        this.setState({
            activeNoteKey: key,
        });
    }

    handleTypeFilter(event) {
        let self = this;

        let searchText = event.target.value;
        this.props.dataSource.search(searchText, -1, false, {parentNotesKey: this.props.filterByParentNotesKey}).then(function(searchResults) {

            self.setState({
                notes: searchResults
            });
       

        });
    }

    handleSetFilter(event) {
        if (event.key == "filterByParentNote") {
            this.modalFilterByParentNotesRef.current.open();
        }
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

    render() {


        console.log("this.props.notes", this.props.notes);
        const filterMenu = (
            <Menu
                onClick={(event)=> this.handleSetFilter(event)} 
                items={this.getFilterMenuItems()}
            />
        );

        let activeFiltersCount = 0;
        if (this.props.filterByParentNotesKey && this.props.filterByParentNotesKey.length > 0) {
            activeFiltersCount++;
        }

        return (
            <>
                <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
                    <div>
                        <Search 
                            placeholder="filter" 
                            allowClear 
                            style={{ width: '100%' }} 
                            onChange={(event)=> this.handleTypeFilter(event)} />
                    </div>

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

                            <Button>
                                <Space>
                                    Sort
                                    <DownOutlined />
                                </Space>
                            </Button>
                        </Space>
                    </div>

                    <List
                        bordered
                        dataSource={this.props.notes}
                        renderItem={note => (
                            <List.Item 
                                
                            >
                                <List.Item.Meta
                                    title={
                                            <>
                                                <Checkbox shape="round"  
                                                color="success" 
                                                style={{ 
                                                    display: "inline-block",
                                                    fontSize: 14  }} 
                                                checked={note.done} 
                                                onChange={(event)=> this.setDone(event)} />
                                                <a 
                                                onClick={(event)=> this.handleClickNote(note.key, event)}>{note.title}</a>
                                            </>
                                        }
                                    description={
                                        <>
                                            <strong>{this.props.getNoteTypeLabel(note.type)}</strong>&nbsp;
                                            Priority: <strong>{note.priority}</strong> 
                                        </>
                                    }
                                />
                            </List.Item>
                        )}
                    />

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

export {NotesList};