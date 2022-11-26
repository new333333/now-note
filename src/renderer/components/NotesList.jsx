import React from 'react';

import { Input, Space, Tooltip, Badge, List, InputNumber, Typography, Button, Dropdown, Menu, Modal, AutoComplete } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { Checkbox } from 'pretty-checkbox-react';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';
const { Text, Link } = Typography;

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
                            {this.props.repositorySettings.filterOnlyTasks ? <Typography.Text mark>Only Tasks</Typography.Text> : <>Only Tasks</>}
                        </>,
                key: 'filterOnlyTasks',
            },
            {
                label:  <>
                            {this.props.repositorySettings.filterOnlyNotes ? <Typography.Text mark>Only Notes</Typography.Text> : <>Only Notes</>}
                        </>,
                key: 'filterOnlyNotes',
            },
            {
                type: 'divider',
            },
            {
                label:  <>
                            {this.props.repositorySettings.filterOnlyDone ? <Typography.Text mark>Only Done</Typography.Text> : <>Only Done</>}
                        </>,
                key: 'filterOnlyDone',
            },
            {
                label:  <>
                            {this.props.repositorySettings.filterOnlyNotDone ? <Typography.Text mark>Only NOT Done</Typography.Text> : <>Only NOT Done</>}
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

        console.log("NotesList render start");
        console.log("this.props.notes", this.props.notes);

        const filterMenu = (
            <Menu
                onClick={(event)=> this.handleSetFilter(event)} 
                items={this.getFilterMenuItems()}
            />
        );

        let activeFiltersCount = 0;
        if (this.props.repositorySettings.filterOnlyNotes || this.props.repositorySettings.filterOnlyTasks) {
            activeFiltersCount++;
        }
        if (this.props.repositorySettings.filterOnlyDone || this.props.repositorySettings.filterOnlyNotDone) {
            activeFiltersCount++;
        }

        return (
            <div className='n3-bar-vertical'>
                <div className={`nn-header ${this.props.trash ? "nn-trash-background-color" : ""}`}>
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
                <div style={{backgroundColor: "#fafafa", padding: "5px", overflow: "auto", height: "100%"}}>

                    <div>
                        {
                            this.props.note &&
                            <NoteBreadCrumbCollapse parents={this.props.note.parents} openNoteDetails={this.props.activateNote} />}
                    </div>

                    <div>

                        <List
                            locale={{emptyText: "No Children Notes"}}
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
                                                                disabled={this.props.trash} 
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
                                                <div style={{color: "#bbb", fontSize: "12px", overflow: "hidden", whiteSpace: "nowrap"}}>
                                                    <Tooltip title={note.path}>
                                                        {note.path}
                                                    </Tooltip>
                                                </div>
                                                <span style={{marginRight: "5px", fontWeight: "bold"}}>
                                                    {
                                                        !this.props.trash &&
                                                        <Link strong onClick={(event)=> this.handleChangeType(note.key, note.type)}>
                                                            {this.props.getNoteTypeLabel(note.type)}
                                                        </Link>
                                                    }
                                                    {
                                                        this.props.trash &&
                                                        <Text strong>{this.props.getNoteTypeLabel(note.type)}</Text>
                                                    }
                                                </span>
                                                <span style={{whiteSpace: "nowrap"}}>
                                                    Priority:&nbsp;
                                                    {
                                                        this.props.trash &&
                                                        <Text strong>{note.priority}</Text>
                                                    }
                                                    {
                                                        !this.props.trash &&
                                                        <InputNumber 
                                                            disabled={this.props.trash}
                                                            style={{width: "70px"}}
                                                            min={0} 
                                                            size="small"
                                                            value={note.priority} 
                                                            onChange={(event)=> this.props.handleChangePriority(note.key, event)} 
                                                        />
                                                    }
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