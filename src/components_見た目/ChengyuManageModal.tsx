import { saveChengyuToCloud } from '../firebaseFunctions';
import { useState } from 'react';
type Item = {
  id: string;
  zh: string;
  py: string;
  ja: string;
};

const ChengyuManageModal = ({
  allChengyuList,
  setAllChengyuList,
  setRandomChengyu,
  setIsChengyuManageModalOpen,
  setIsChengyuModalOpen,
  setEditingChengyu,
  setIsChengyuImportModalOpen,
}: any) => {

  

const list = allChengyuList;
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  return (
  <div>
{editingItem && (
  <div>
    <h3>編集モード</h3>

    <input
      value={editingItem.zh}
      onChange={(e) =>
        setEditingItem({ ...editingItem, zh: e.target.value })
      }
    />

    <input
      value={editingItem.py}
      onChange={(e) =>
        setEditingItem({ ...editingItem, py: e.target.value })
      }
    />

    <input
      value={editingItem.ja}
      onChange={(e) =>
        setEditingItem({ ...editingItem, ja: e.target.value })
      }
    />
    <button
  onClick={async () => {
    const updated = list.map((item) =>
  item.id === editingItem.id ? editingItem : item
);

    setAllChengyuList(updated);
    await saveChengyuToCloud(updated);

    setEditingItem(null);
  }}
>
  保存
</button>
  </div>
)}
    
    <h2>成語管理</h2>
    {editingItem && (
  <div>
    編集中: {editingItem.zh}
  </div>
)}

    <ul>
     {list.map((item: Item, index: number) => (
        <li key={index}>
          <div>{item.zh}</div>
          <div>{item.py}</div>
          <div>{item.ja}</div>

          <button
            onClick={async () => {
              const updated = list.filter((_: Item, i: number) => i !== index);
              setAllChengyuList(updated);
              await saveChengyuToCloud(updated);
            }}
          >
            削除
          </button>

         <button
  onClick={() => {
    setEditingItem(item);
  }}
>
  編集
</button>
        </li>
      ))}
    </ul>
  </div>
);
};

export default ChengyuManageModal;
