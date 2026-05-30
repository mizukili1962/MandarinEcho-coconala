import type { Chengyu } from '../types';
import React from 'react';

type Props = {
  allChengyuList: Chengyu[];
  setAllChengyuList: React.Dispatch<React.SetStateAction<Chengyu[]>>;
  setRandomChengyu: React.Dispatch<React.SetStateAction<Chengyu | null>>;
  setIsChengyuManageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsChengyuModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingChengyu: React.Dispatch<React.SetStateAction<Chengyu | null>>;
  setIsChengyuImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChengyuManageModal = ({
  allChengyuList,
  setAllChengyuList,
  setRandomChengyu,
  setIsChengyuManageModalOpen,
  setIsChengyuModalOpen,
  setEditingChengyu,
  setIsChengyuImportModalOpen,
}: Props) => {
  return (
    <div>
      ChengyuManageModal
    </div>
  );
};

export default ChengyuManageModal;
