import { saveChengyuToCloud } from '../firebaseFunctions';
import { useState } from 'react';
type Item = {
  zh: string;
  py: string;
  ja: string;
};

const ChengyuManageModal = () => {
  const mockList: Item[] = [
  { zh: "一石二鳥", py: "yī shí èr niǎo", ja: "一つで二つの利益" },
  { zh: "画蛇添足", py: "huà shé tiān zú", ja: "余計なことをする" },
];

const [list, setList] = useState<Item[]>(mockList);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  return (
  <div>
    <h2>成語管理</h2>

    <ul>
      {list.map((item, index) => (
        <li key={index}>
          <div>{item.zh}</div>
          <div>{item.py}</div>
          <div>{item.ja}</div>

          <button
            onClick={async () => {
              const updated = list.filter((_, i) => i !== index);
              setList(updated);
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
