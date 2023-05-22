import React from 'react';
import { Typography, Tooltip } from 'antd';
import { UserSettingsRepository } from 'types';

const { Link } = Typography;

interface FooterProps {
  repository: UserSettingsRepository;
  changeRepository: Function;
}

export default function Footer({ repository, changeRepository }: FooterProps) {
  return (
    <div id="nn-footer">
      <Tooltip title="Choose other Repository">
        <Link onClick={(event) => changeRepository()}>
          <strong>Repository:</strong> {repository && repository.path}
          {!repository && <>No repository initialized</>}
        </Link>
      </Tooltip>
    </div>
  );
}
