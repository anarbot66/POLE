import React, { useState } from 'react';
import SwipeableBottomSheet from 'react-swipeable-bottom-sheet';

const CommentsBottomSheet = ({ open, onClose, children }) => {
  return (
    <SwipeableBottomSheet
      open={open}
      onChange={(openState) => {
        if (!openState) onClose();
      }}
      fullScreen={false}  // или true, если нужно занять почти весь экран
    >
      <div style={{ padding: 20 }}>
        {children}
      </div>
    </SwipeableBottomSheet>
  );
};

export default CommentsBottomSheet;
