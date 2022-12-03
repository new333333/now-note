import React from 'react';
import { Breadcrumb, Dropdown, Menu, Space, Input, InputNumber, Typography, Select } from 'antd';
import { HomeOutlined, DownOutlined } from '@ant-design/icons';
const { Text, Link } = Typography;

class NotePriority extends React.Component {

    constructor(props) {
        super(props);
        this.handleChangePriority = this.handleChangePriority.bind(this);
    }

    handleChangePriority(value) {
      this.props.handleChangePriority(this.props.noteKey, value );
    }

    handleChangePriorityMenu(event) {
        this.props.handleChangePriority(this.props.noteKey, this.props.priorityStat[event.key] );
    }

    render() {

        let minimumPriority = 0;
        if (this.props.priorityStat) {
            minimumPriority = this.props.priorityStat.minimum;
        }

        let maximumPriority = 0;
        if (this.props.priorityStat) {
            maximumPriority = this.props.priorityStat.maximum;
        }

        let averagePriority = 0;
        if (this.props.priorityStat) {
            averagePriority = this.props.priorityStat.average;
        }

        let medianaPriority = 0;
        if (this.props.priorityStat) {
            medianaPriority = this.props.priorityStat.mediana;
        }


        const priorityMenu = (
            <Menu
                onClick={(event)=> this.handleChangePriorityMenu(event)}
                items={[
                    {
                        key: 'minimum',
                        label: "Set: " + minimumPriority + " (Minimum)",
                    },
                    {
                        key: 'average',
                        label: "Set: " + averagePriority + " (Average)",
                    },
                    {
                        key: 'mediana',
                        label: "Set: " + medianaPriority + " (Mediana)",
                    },
                    {
                        key: 'maximum',
                        label: "Set: " + maximumPriority + " (Maximum)",
                    },
                ]}
            />
          );

        return (
            <span style={{marginRight: "5px"}}>
                Priority:&nbsp;
                {
                    !this.props.trash && 
                    <Dropdown overlay={priorityMenu}>
                        <InputNumber 
                            disabled={true}
                            min={0} 
                            size="small"
                            value={this.props.priority} 
                            onChange={(event)=> this.handleChangePriority(event)} 
                            /> 
                    </Dropdown>
                } 
                {
                    this.props.trash && 
                    <Text strong>{this.props.priority}</Text>
                }
            </span>
        );
    }
}

export {NotePriority};