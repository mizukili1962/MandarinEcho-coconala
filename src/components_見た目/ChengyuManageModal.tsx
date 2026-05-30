const ChengyuManageModal = () => {
  const mockList = [
    { zh: "一石二鳥", py: "yī shí èr niǎo", ja: "一つで二つの利益" },
    { zh: "画蛇添足", py: "huà shé tiān zú", ja: "余計なことをする" },
  ];

  return (
    <div>
      <h2>成語管理</h2>

      <ul>
        {mockList.map((item, i) => (
          <li key={i}>
            <div>{item.zh}</div>
            <div>{item.py}</div>
            <div>{item.ja}</div>

            <button
  onClick={() => {
    alert("削除テスト：" + item.zh);
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
