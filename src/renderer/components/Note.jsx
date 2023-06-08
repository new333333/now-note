import React from 'react';
import { Dropdown, Divider, Checkbox, Tooltip, Typography, Button } from 'antd';
import Icon, { UnorderedListOutlined, PlusOutlined, DeleteFilled, EllipsisOutlined, ApartmentOutlined } from '@ant-design/icons';
import DetailsPriorityComponent from './DetailsPriorityComponent';
import { NoteBacklinks } from './NoteBacklinks.jsx';
import DetailsTitleComponent from './DetailsTitleComponent';
import { NoteDescription } from './NoteDescription';
import { NoteBreadCrumbCollapse } from './NoteBreadCrumbCollapse.jsx';
import DetailsTagsComponent from './DetailsTagsComponent';
import DetailsNoteType from './DetailsNoteType';

const { Text } = Typography;



class Note extends React.Component {

    constructor(props) {
        super(props);

        this.descriptionDomRef = React.createRef();

        this.handleNoteMenu = this.handleNoteMenu.bind(this);
    }

    handleChangeDone(event) {
        this.props.handleChangeDone(this.props.note.key, event.target.checked);
    }

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
                            {/*<>
                                <FontAwesomeIcon icon={solid('user-secret')} />
                            </>*/}
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
                                <DetailsTitleComponent
                                  readOnly={this.props.note.trash}
                                  noteKey={this.props.note.key}
                                  initValue={this.props.note.title}
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
                                <DetailsNoteType
                                  readOnly={this.props.note.trash}
                                  noteKey={this.props.note.key}
                                  initValue={this.props.note.type}
                                />
                                <DetailsPriorityComponent
                                  readOnly={this.props.note.trash}
                                  noteKey={this.props.note.key}
                                  initValue={this.props.note.priority}
                                />
                                <DetailsTagsComponent
                                  readOnly={this.props.note.trash}
                                  noteKey={this.props.note.key}
                                />
                        </div>
                        <Divider style={{margin: "5px 0"}} />
                        <div style={{flex: 1}}>
                            <NoteDescription
                                ref={this.descriptionDomRef}
                                noteKey={this.props.note.key}
                                description={this.props.note.description}
                                disabled={this.props.note.trash}
                                handleChangeDescription={this.props.handleChangeDescription}
                                dataService={this.props.dataService}
                                openNoteInTreeAndDetails={this.props.openNoteInTreeAndDetails}
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
