import React from 'react';

import { Input, Space, Tooltip, Badge, List, InputNumber, Typography, Button, Dropdown, Menu, Spin, Checkbox, Divider } from 'antd';
import { DownOutlined, UnorderedListOutlined, PlusOutlined, DeleteFilled } from '@ant-design/icons';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';
import InfiniteScroll from 'react-infinite-scroll-component';

const { Text, Link } = Typography;

class NotesList extends React.Component {

    constructor(props) {
        super(props);
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleClickNote = this.handleClickNote.bind(this);
        this.handleSetFilter = this.handleSetFilter.bind(this);
        this.handleNoteMenu = this.handleNoteMenu.bind(this);

        this.setFilterOnlyTasks = this.setFilterOnlyTasks.bind(this);
        this.setFilterOnlyNotes = this.setFilterOnlyNotes.bind(this);

        this.setFilterOnlyDone = this.setFilterOnlyDone.bind(this);
        this.setFilterOnlyNotDone = this.setFilterOnlyNotDone.bind(this);
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

    handleSetFilter(key) {
        if (key == "filterOnlyTasks") {
            this.setFilterOnlyTasks();
        } else if (key == "filterOnlyNotes") {
            this.setFilterOnlyNotes();
        } else if (key == "filterOnlyDone") {
            this.setFilterOnlyDone();
        } else if (key == "filterOnlyNotDone") {
            this.setFilterOnlyNotDone();
        }
    }

    

    async setFilterOnlyTasks() {

        let prevFilterOnlyTasks = this.props.filter.onlyTasks;
        let prevFilterOnlyNotes = this.props.filter.onlyNotes;

        let filter = {...this.props.filter, ...{
            onlyTasks: (!prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                                (prevFilterOnlyTasks && !prevFilterOnlyNotes) ? false : (
                                    (!prevFilterOnlyTasks && prevFilterOnlyNotes) ? true : false)), 
            onlyNotes: false, 
        }};


        this.props.setFilter(filter);
    }

    async setFilterOnlyNotes() {

        let prevFilterOnlyTasks = this.props.filter.onlyTasks;
        let prevFilterOnlyNotes = this.props.filter.onlyNotes;

        let filter = {...this.props.filter, ...{
            onlyTasks: false, 
            onlyNotes: (!prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                (prevFilterOnlyTasks && !prevFilterOnlyNotes) ? true : (
                    (!prevFilterOnlyTasks && prevFilterOnlyNotes) ? false : false)),    
        }};


        this.props.setFilter(filter);
    }

    async setFilterOnlyDone() {
        let prevFilterOnlyDone = this.props.filter.onlyDone;
        let prevFilterOnlyNotDone = this.props.filter.onlyNotDone;

        let filter = {...this.props.filter, ...{
            onlyDone: (!prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                                (prevFilterOnlyDone && !prevFilterOnlyNotDone) ? false : (
                                    (!prevFilterOnlyDone && prevFilterOnlyNotDone) ? true : false)), 
            onlyNotDone: false, 
        }};

        this.props.setFilter(filter);
    }

    async setFilterOnlyNotDone() {
        let prevFilterOnlyDone = this.props.filter.onlyDone;
        let prevFilterOnlyNotDone = this.props.filter.onlyNotDone;

        let filter = {...this.props.filter, ...{
            onlyDone: false, 
            onlyNotDone: (!prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                (prevFilterOnlyDone && !prevFilterOnlyNotDone) ? true : (
                    (!prevFilterOnlyDone && prevFilterOnlyNotDone) ? false : false)),    
        }};

        this.props.setFilter(filter);
    }

    getFilterMenuItems() {
        let menuItems = [
            {
                label:  <>
                            {this.props.filter.onlyTasks ? <Typography.Text mark>Only Tasks</Typography.Text> : <>Only Tasks</>}
                        </>,
                key: 'filterOnlyTasks',
            },
            {
                label:  <>
                            {this.props.filter.onlyNotes ? <Typography.Text mark>Only Notes</Typography.Text> : <>Only Notes</>}
                        </>,
                key: 'filterOnlyNotes',
            },
            {
                type: 'divider',
            },
            {
                label:  <>
                            {this.props.filter.onlyDone ? <Typography.Text mark>Only Done</Typography.Text> : <>Only Done</>}
                        </>,
                key: 'filterOnlyDone',
            },
            {
                label:  <>
                            {this.props.filter.onlyNotDone ? <Typography.Text mark>Only NOT Done</Typography.Text> : <>Only NOT Done</>}
                        </>,
                key: 'filterOnlyNotDone',
            },
        ];

        return menuItems;
    }

    handleChangeDone(key, event) {
        this.props.handleChangeDone(key, event.target.checked);
    }

    async handleNoteMenu(event) {
        // console.log("handleNoteMenu, event=", event);

        if (event.key == "open_tree") {
            this.props.openNoteInTree(this.props.note.key);
        } else if (event.key == "open_list") {
            this.props.openNoteInList(this.props.note.key);
        }
    }

    render() {

        // console.log("NotesList render start");
        // console.log("NotesList render this.props.filter=", this.props.filter);

        const items= this.getFilterMenuItems();
        const onClick = ({ key }) => {
            this.handleSetFilter(key);
        };

        let activeFiltersCount = 0;
        if (this.props.filter.onlyNotes || this.props.filter.onlyTasks) {
            activeFiltersCount++;
        }
        if (this.props.filter.onlyDone || this.props.filter.onlyNotDone) {
            activeFiltersCount++;
        }

        let noteMenu = undefined;
        if (this.props.note) {
            let noteMenuItems = [];
            noteMenuItems.push({
                key: 'open_tree',
                label: "Open tree",
            });
            noteMenuItems.push({
                key: 'open_list',
                label: "Open as list",
                icon: <UnorderedListOutlined />,
            });
            noteMenu = (
                <Menu
                    onClick={(event)=> this.handleNoteMenu(event)}
                    items={noteMenuItems}
                />
            );
        }


        let loading = this.props.loading != undefined && this.props.loading && true;

        return (
            <div className='n3-bar-vertical'>
                <div className={`nn-header ${this.props.trash ? "nn-trash-background-color" : ""}`}>
                    <Space>
                        <Dropdown menu={{items, onClick}}>
                            <Button size="small">
                                <Space>
                                    Filter {activeFiltersCount > 0 ? <Badge size="small" count={activeFiltersCount} /> : ""}
                                    <DownOutlined />
                                </Space>
                            </Button>
                        </Dropdown>

                        {/* <Button size="small">
                            <Space>
                                Sort
                                <DownOutlined />
                            </Space>
                            </Button> */}
                    </Space>
                </div>
                <div id="nn-nodes-list" className='nn-nodes-list'>

                    <Spin spinning={loading}>

                        <div>
                            {
                                this.props.note &&
                                <NoteBreadCrumbCollapse parents={this.props.note.parents} handleClickNote={this.props.openNoteInList} />}
                        </div>

                        <div>
                            {
                                !this.props.note && 
                                <Text type="secondary">No note selected.</Text>
                            }
                            {
                                this.props.note &&
                                <InfiniteScroll
                                    dataLength={this.props.note.filteredSiblings.length}
                                    next={this.props.openNoteInListLoadMore}
                                    hasMore={this.props.note.filteredSiblingsHasMore}
                                    loader={<Spin />}
                                    endMessage={<></>}
                                    scrollableTarget="nn-nodes-list"
                                >
                                    <List
                                        header={<Text strong>{this.props.note.filteredSiblingsMaxResults} { this.props.note.filteredSiblingsMaxResults == 1 && <>Note</> }{ this.props.note.filteredSiblingsMaxResults != 1 && <>Notes</> }</Text>}
                                        locale={{emptyText: "No Children Notes"}}
                                        bordered
                                        size="small"
                                        dataSource={this.props.note.filteredSiblings}
                                        renderItem={(note, index) => (
                                            <List.Item 
                                            size="small"
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <div className="nn-list-breadCrumb">
                                                            <Tooltip title={note.path}>
                                                                {note.path}
                                                            </Tooltip>
                                                        </div>
                                                        }
                                                    description={
                                                        <div style={{overflow: "hidden"}}>
                                                            <div style={{whiteSpace: "nowrap"}}>
                                                                <Text strong type="secondary" style={{paddingRight: "5px"}}>{index + 1}.</Text>
                                                                {
                                                                    note.type == "task" &&
                                                                        <Checkbox 
                                                                            style={{paddingRight: "5px"}}
                                                                            disabled={this.props.trash} 
                                                                            checked={note.done} 
                                                                            onChange={(event)=> this.handleChangeDone(note.key, event)} />
                                                                }
                                                                {/*<Dropdown menu={noteMenu} trigger={['contextMenu']}>*/}
                                                                    <Tooltip title={note.title}>
                                                                        <Link style={{color: "rgba(0, 0, 0, 0.85)", overflow: "hidden", whiteSpace: "nowrap"}} strong onClick={(event)=> this.props.openNoteInTreeAndDetails(note.key)}>
                                                                            {note.title}
                                                                        </Link>
                                                                    </Tooltip>
                                                                {/*</Dropdown>*/}
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
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </InfiniteScroll>
                            }

                        </div>
                    </Spin> 
                </div>
                
            </div>
            
            
        );
    }
}

export {NotesList};