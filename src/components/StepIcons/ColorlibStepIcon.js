import * as React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import AssignmentIcon from '@mui/icons-material/Assignment'; // New icon
import NoteAddIcon from '@mui/icons-material/NoteAdd'; // New icon
import ApprovalIcon from '@mui/icons-material/Approval'; // New icon

const ColorlibStepIconRoot = styled('div')(({ theme }) => ({
  backgroundColor: '#2196F3',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  variants: [
    {
      props: ({ ownerState }) => ownerState.active,
      style: {
        backgroundImage:
          'linear-gradient( 136deg, rgba(33,150,243,1) 0%, rgba(3,169,244,1) 50%, rgba(0,188,212,1) 100%)',
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
      },
    },
    {
      props: ({ ownerState }) => ownerState.completed,
      style: {
        backgroundImage:
          'linear-gradient( 136deg, rgba(33,150,243,1) 0%, rgba(3,169,244,1) 50%, rgba(0,188,212,1) 100%)',
      },
    },
  ],
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  // Updated icons mapping
  const icons = {
    1: <SettingsIcon />,
    2: <GroupAddIcon />,
    3: <VideoLabelIcon />,
    4: <AssignmentIcon />, // New icon
    5: <NoteAddIcon />,     // New icon
    6: <ApprovalIcon />,     // New icon
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

ColorlibStepIcon.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  completed: PropTypes.bool,
  icon: PropTypes.node,
};

export default ColorlibStepIcon;
