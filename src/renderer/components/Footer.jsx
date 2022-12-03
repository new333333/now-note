import React from 'react';
import { Typography, Tooltip } from 'antd';
const { Link } = Typography;

class Footer extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        return (
            <div id="nn-footer">
                <Tooltip title={"Choose other Repository"}>
                    <Link onClick={(event)=> this.props.changeRepository()}>
                        <strong>Repository:</strong> {this.props.repository && this.props.repository.directory} {!this.props.repository && <>No repository initialized</>}
                    </Link>
                </Tooltip>
            </div>
        );
    }
}

export {Footer};