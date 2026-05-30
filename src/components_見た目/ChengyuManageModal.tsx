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
  
  return (
    <div>
      <h2>成語管理</h2>

      <ul>
        {list.map((item, index) => (
  <li key={i}>
    <div>{item.zh}</div>
    <div>{item.py}</div>
    <div>{item.ja}</div>

    <button
      onClick={() => {
        const updated = list.filter((_, index) => index !== i);
        setList(updated);
      }}
    >
      削除
    </button>
  </li>
))}
      </ul>
    </div>
  );
};

export default ChengyuManageModal;
