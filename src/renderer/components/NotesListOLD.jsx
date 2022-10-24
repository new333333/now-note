import React from 'react';

import { Input, Space, Divider, List, Typography, Button, Dropdown, Menu, Modal, AutoComplete } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
const { Search } = Input;
import { grey } from '@ant-design/colors';

class NotesList extends React.Component {

    constructor() {
        super();
        this.state = {
            notes: [],
        };
        this.onClick = this.onClick.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.handleCancelModalFilterByParentNote = this.handleCancelModalFilterByParentNote.bind(this);
        this.handleOkModalFilterByParentNote = this.handleOkModalFilterByParentNote.bind(this);
        this.onChangeAutoComplete = this.onChangeAutoComplete.bind(this);
        this.onSearchAutoComplete = this.onSearchAutoComplete.bind(this);
        this.onSelectAutoComplete = this.onSelectAutoComplete.bind(this);
    }

    componentDidMount() {
        this.init();
    }

    init() {
        let self = this;

        this.props.dataSource.search("", -1, false).then(function(searchResults) {
            self.setState({
                notes: searchResults
            });
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

        this.setState({
            valueAutoComplete: "",
            optionsAutoComplete: [],
            isModalFilterByParentNoteOpen: false,
            filterByParentNoteKey: noteKey,
        });
    }

    onChangeAutoComplete(data) {
        this.setState({
            valueAutoComplete: data
        });
    }

    onClick(key, e) {
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

    onSearch(event) {
        let self = this;

        let searchText = event.target.value;
        this.props.dataSource.search(searchText, -1, false).then(function(searchResults) {

            self.setState({
                notes: searchResults
            });
       

        });
    }

    setFilter(event) {
        if (event.key == "filterByParentNote") {
            this.setState({
                isModalFilterByParentNoteOpen: true
            });
        }
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
    }

    getFilterMenuItems() {
        let menuItems = [
            {
                label:  <>
                            Add Filter by Parent Notes
                        </>,
                key: 'filterByParentNote',
            },
        ];

        return menuItems;
    }

    render() {


        let filterMenuItems

        const filterMenu = (
            <Menu
                onClick={(event)=> this.setFilter(event)} 
                items={this.getFilterMenuItems()}
            />
        );

        return (
            <>
                <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
                    <div>
                        <Search 
                            placeholder="filter" 
                            allowClear 
                            style={{ width: '100%' }} 
                            onChange={(event)=> this.onSearch(event)} />
                    </div>

                    <div>
                        <Space>
                            <Dropdown overlay={filterMenu}>
                                <Button>
                                    <Space>
                                        Filter <Typography.Text mark>2</Typography.Text>
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
                        dataSource={this.state.notes}
                        renderItem={note => (
                            <List.Item 
                                onClick={(event)=> this.onClick(note.key, event)}
                                style={{backgroundColor: this.state.activeNoteKey && this.state.activeNoteKey == note.key ? grey[1] : ""}}
                            >
                                <Typography.Text strong>{note.title}</Typography.Text>
                            </List.Item>
                        )}
                    />

                </div>
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
                </Modal>
            </>
        );
    }
}

export {NotesList};