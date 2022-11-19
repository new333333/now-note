import React from 'react';

import { Input, Space, Divider, Badge, List, InputNumber, Typography, Button, Dropdown, Menu, Modal, AutoComplete } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
const { Search } = Input;
import { grey } from '@ant-design/colors';
import {ModalFilterByParentNotes} from './ModalFilterByParentNotes.jsx';
import { Checkbox } from 'pretty-checkbox-react';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';

class NotesList extends React.Component {

    constructor() {
        super();
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleClickNote = this.handleClickNote.bind(this);
        this.handleSetFilter = this.handleSetFilter.bind(this);
    }

    handleChangeType(key, type) {
        let self = this;
        let foundTypeIdx = this.props.noteTypes.findIndex(function(noteType) {
            return noteType.key === type;
        });
        this.props.handleChangeType(key, this.props.noteTypes[foundTypeIdx == 0 ? 1 : 0].key );
    }

    handleClickNote(key, e) {
        this.props.openNoteDetails(key);
    }

    handleSetFilter(event) {
        if (event.key == "filterOnlyTasks") {
            this.props.setFilterOnlyTasks();
        } else if (event.key == "filterOnlyNotes") {
            this.props.setFilterOnlyNotes();
        } else if (event.key == "filterOnlyDone") {
            this.props.setFilterOnlyDone();
        } else if (event.key == "filterOnlyNotDone") {
            this.props.setFilterOnlyNotDone();
        }
    }

    getFilterMenuItems() {
        let menuItems = [
            {
                label:  <>
                            {this.props.filterOnlyTasks ? <Typography.Text mark>Only Tasks</Typography.Text> : <>Only Tasks</>}
                        </>,
                key: 'filterOnlyTasks',
            },
            {
                label:  <>
                            {this.props.filterOnlyNotes ? <Typography.Text mark>Only Notes</Typography.Text> : <>Only Notes</>}
                        </>,
                key: 'filterOnlyNotes',
            },
            {
                type: 'divider',
            },
            {
                label:  <>
                            {this.props.filterOnlyDone ? <Typography.Text mark>Only Done</Typography.Text> : <>Only Done</>}
                        </>,
                key: 'filterOnlyDone',
            },
            {
                label:  <>
                            {this.props.filterOnlyNotDone ? <Typography.Text mark>Only NOT Done</Typography.Text> : <>Only NOT Done</>}
                        </>,
                key: 'filterOnlyNotDone',
            },
        ];

        return menuItems;
    }

    handleChangeDone(key, event) {
        this.props.handleChangeDone(key, event.target.checked);
    }

    render() {
        const filterMenu = (
            <Menu
                onClick={(event)=> this.handleSetFilter(event)} 
                items={this.getFilterMenuItems()}
            />
        );

        let activeFiltersCount = 0;
        if (this.props.filterOnlyNotes || this.props.filterOnlyTasks) {
            activeFiltersCount++;
        }
        if (this.props.filterOnlyDone || this.props.filterOnlyNotDone) {
            activeFiltersCount++;
        }

        return (
            <div className='n3-bar-vertical'>
                <div className="nn-header">
                    <Space>
                        <Dropdown overlay={filterMenu}>
                            <Button>
                                <Space>
                                    Filter {activeFiltersCount > 0 ? <Badge count={activeFiltersCount} /> : ""}
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
                <div style={{padding: "5px", overflow: "auto"}}>

                    <div>
                        {
                            this.props.note &&
                            <NoteBreadCrumbCollapse parents={this.props.note.parents} openNoteDetails={this.props.activateNote} />}
                    </div>

                    <div>

                        <List
                            
                            bordered
                            size="small"
                            dataSource={this.props.notes}
                            renderItem={note => (
                                <List.Item 
                                    
                                >
                                    <List.Item.Meta
                                        title={
                                                <>
                                                    {
                                                        note.type == "task" &&
                                                            <Checkbox shape="round"  
                                                            color="success" 
                                                            style={{ 
                                                                display: "inline-block",
                                                                fontSize: 14  }} 
                                                            checked={note.done} 
                                                            onChange={(event)=> this.handleChangeDone(note.key, event)} />
                                                    }
                                                    <a style={{fontWeight: "bold"}}
                                                    onClick={(event)=> this.handleClickNote(note.key, event)}>{note.title}</a>
                                                    
                                                </>
                                            }
                                        description={
                                            <>
                                                <div style={{marginLeft: "5px", color: "#bbb", fontSize: "12px"}}>{note.path}</div>
                                                <span style={{marginRight: "5px", fontWeight: "bold"}}>
                                                    <a href="#" onClick={(event)=> this.handleChangeType(note.key, note.type)}><strong>{this.props.getNoteTypeLabel(note.type)}</strong></a>
                                                </span>
                                                <span style={{whiteSpace: "nowrap"}}>
                                                    Priority:
                                                    <InputNumber 
                                                        min={0} 
                                                        size="small"
                                                        value={note.priority} 
                                                        onChange={(event)=> this.props.handleChangePriority(note.key, event)} 
                                                    />
                                                </span>
                                            </>
                                        }
                                    />
                                </List.Item>
                            )}
                        />

                    </div>
                </div>
            </div>
        );
    }
}

export {NotesList};