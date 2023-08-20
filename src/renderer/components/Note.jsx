import React from 'react';
import { Dropdown, Divider, Checkbox, Tooltip, Typography, Button } from 'antd';
import Icon, { UnorderedListOutlined, PlusOutlined, DeleteFilled, EllipsisOutlined, ApartmentOutlined } from '@ant-design/icons';
import DetailsPriorityComponent from './DetailsPriorityComponent';
import { NoteBacklinks } from './NoteBacklinks.jsx';
import DetailsTitleComponent from './DetailsTitleComponent';
import { NoteDescription } from './NoteDescription';
import { NoteBreadCrumbCollapse } from './NoteBreadCrumbCollapse';
import DetailsTagsComponent from './DetailsTagsComponent';
import DetailsNoteType from './DetailsNoteType';
import DetailsMenu from './DetailsMenu';
import NoteBreadCrumb from './NoteBreadCrumb';

const { Text } = Typography;

class Note extends React.Component {
  constructor(props) {
    super(props);
    this.descriptionDomRef = React.createRef();
  }

  handleChangeDone(event) {
      this.props.handleChangeDone(this.props.note.key, event.target.checked);
  }

  async saveChanges() {
    if (this.descriptionDomRef.current) {
      this.descriptionDomRef.current.saveChanges();
    }
  }

    render() {

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
                  <NoteBreadCrumb
                    initValue={this.props.note.parents}
                    noteKey={this.props.note.key}
                  />
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
                                      disabled={this.props.trash}
                                      checked={this.props.note.done}
                                      onChange={(event)=> this.handleChangeDone(event)} />
                              </Tooltip>
                          </div>
                  }
                  <div style={{flexBasis: "100%" }} >
                    <DetailsTitleComponent
                      readOnly={this.props.trash}
                      noteKey={this.props.note.key}
                      initValue={this.props.note.title}
                    />
                  </div>
                  <div>
                    <DetailsMenu
                      readOnly={this.props.trash}
                      noteKey={this.props.note.key}
                      updatedAt={this.props.note.updatedAt}
                      createdAt={this.props.note.createdAt}
                      createdBy={this.props.note.createdBy}
                    />
                  </div>
                </div>
                <Divider style={{margin: "5px 0"}} />
                <div style={{padding: "5px 0"}}>
                  <DetailsNoteType
                    readOnly={this.props.trash}
                    noteKey={this.props.note.key}
                    initValue={this.props.note.type}
                  />
                  <DetailsPriorityComponent
                    readOnly={this.props.trash}
                    noteKey={this.props.note.key}
                    initValue={this.props.note.priority}
                  />
                  <DetailsTagsComponent
                    readOnly={this.props.trash}
                    noteKey={this.props.note.key}
                  />
                </div>
                <Divider style={{margin: "5px 0"}} />
                <div style={{flex: 1}}>
                  <NoteDescription
                    ref={this.descriptionDomRef}
                    noteKey={this.props.note.key}
                    description={this.props.note.description}
                    disabled={this.props.trash}
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
