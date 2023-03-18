import React from 'react';
import {Dropdown, Menu, Divider, Checkbox, Tooltip, Collapse, Typography, Button, Input} from 'antd';
const { TextArea } = Input;
import Icon, {HistoryOutlined, UnorderedListOutlined, PlusOutlined, DeleteFilled, EllipsisOutlined, ApartmentOutlined} from '@ant-design/icons';
import {NotePriority} from './NotePriority.jsx';
import {NoteBacklinks} from './NoteBacklinks.jsx';
import {NoteTags} from './NoteTags.jsx';
import {NoteTitle} from './NoteTitle.jsx';
import {NoteDescription} from './NoteDescription.jsx';
import {NoteBreadCrumbCollapse} from './NoteBreadCrumbCollapse.jsx';
import {SearchNotes} from './SearchNotes.jsx';
const {Panel} = Collapse;
const {Text, Link, Paragraph} = Typography;



class Note extends React.Component {

    constructor(props) {
        super(props);

        this.descriptionDomRef = React.createRef();
        
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleNoteMenu = this.handleNoteMenu.bind(this);
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

/*
    componentWillUnmount() {
        // console.log("componentWillUnmount(value, editor)", value);
        if (this.tinyMCEDomRef.current && this.props.note) {
            if (this.tinyMCEDomRef.current.isDirty()) {
                this.props.handleChangeDescription(this.props.note.key, this.tinyMCEDomRef.current.getContent());
            }
        }
    }
*/

    async saveChanges() {
        if (this.descriptionDomRef.current) {
            this.descriptionDomRef.current.saveChanges();
        }
    }

    async addNote(key) {
        console.log("addNote, key=", key);
        let newNote = await this.props.addNote(key);
    }

    async delete(key) {
        console.log("delete, key=", key);
        this.props.delete(key);
    }

    async handleNoteMenu(key) {
        console.log("handleNoteMenu, key=", key);

        if (key == "add_note") {
            this.addNote(this.props.note.key)
        } else if (key == "open_tree") {
            this.props.openNoteInTree(this.props.note.key);
        } else if (key == "open_list") {
            this.props.openNoteInList(this.props.note.key);
        } else if (key == "delete") {
            this.delete(this.props.note.key);
        } else if (key == "restore") {
            this.props.restore(this.props.note.key);
        } else if (key == "history") {
            this.props.showHistory(this.props.note.key);
        }

        
    }
    

    render() {

        const items = [];
        if (this.props.note) {
            
            if (!this.props.note.trash) { 
                items.push({
                    key: 'add_note',
                    label: "Add note",
                    icon: <PlusOutlined />,
                });
            }
            items.push({
                key: 'open_tree',
                label: "Focus in tree",
                icon: <ApartmentOutlined />,
            });
            items.push({
                key: 'open_list',
                label: "List sub notes",
                icon: <UnorderedListOutlined />,
            });
            items.push({
                key: 'delete',
                label: this.props.note.trash ? "Delete Permanently" : "Move To Trash",
                icon: <DeleteFilled />,
            });
            if (this.props.note.trash) { 
                items.push({
                    key: 'restore',
                    label: "Restore",
                });
            }

            /*
            items.push({
                key: 'history',
                label: "History",
                icon: <HistoryOutlined />,
            });
            */
           
            items.push({
                type: 'divider'
            });
            

            items.push({
                key: 'metadata',
                disabled: true,
                label: <>
                        <div className="nn-note-metadata">Last modified: {this.props.note.updatedAt.toLocaleString()}</div> 
                        <div className="nn-note-metadata">Created on: {this.props.note.createdAt.toLocaleString()}</div>
                        <div className="nn-note-metadata">Created by: {this.props.note.createdBy}</div> 
                        <div className="nn-note-metadata">Id: {this.props.note.key}</div> 
                        </>,
            });

        }

        const onClick = ({ key }) => {
            this.handleNoteMenu(key);
        };

        

        return (
            <div id="nn-note">
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
                            <div style={{flexBasis: "100%" }} >
                                <NoteTitle 
                                    note={this.props.note} 
                                    editableTitle={this.props.editableTitle}
                                    handleChangeTitle={this.props.handleChangeTitle}
                                />
                            </div>
                            <div>
                                <Dropdown menu={{items,onClick}}>
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
                            <NoteDescription 
                                ref={this.descriptionDomRef}
                                note={this.props.note}
                                handleChangeDescription={this.props.handleChangeDescription} 
                                dataSource={this.props.dataSource}
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