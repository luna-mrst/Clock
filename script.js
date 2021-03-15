window.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "alermData";
  const api = "https://worldtimeapi.org/api/timezone/Asia/Tokyo";
  const timeViewArea = document.getElementById("timeViewArea");
  const diffViewArea = document.getElementById("diffViewArea");
  const reloadBtn = document.getElementById("reload");
  const alermTable = document.getElementById("alermTable");
  const alermSwitch = document.getElementById("alermSwitch");
  const dispAlerm = document.getElementById("dispAlerm");

  let timeDiff = 0;
  let responseDiff = 0;

  // アラームを登録する
  const alert = new Audio("audio/alert.wav");
  const timeoutIdList = [];
  const registrationAlerm = () => {
    timeoutIdList.forEach((id) => clearTimeout(id));
    timeoutIdList.length = 0;
    registrationLocalStrage();
    const [alermTimes] = JSON.parse(localStorage.getItem(STORAGE_KEY));

    const now = new Date();
    alermTimes.forEach((time) => {
      const [h, m, s] = time.split(":");
      const alermTime = new Date();
      alermTime.setHours(h);
      alermTime.setMinutes(m);
      alermTime.setSeconds(s - 11);
      alermTime.setMilliseconds(0);

      if (now > alermTime) {
        // 既に過ぎた時刻のためアラームを登録しない
        return;
      }

      const timeoutId = setTimeout(() => {
        let intervalCount = 10;
        const intervalId = setInterval(() => {
          alert.play();
          if (--intervalCount < 0) clearInterval(intervalId);
        }, 1000);
      }, alermTime.getTime() - Date.now() + timeDiff);
      timeoutIdList.push(timeoutId);
    });
  };

  /**
   * 時刻APIから時刻を取得し、差分を更新する。
   */
  const refleshDiff = () => {
    reloadBtn.setAttribute("disabled", "disabled");
    const beforeTime = Date.now();
    fetch(api, {
      mode: "cors",
    }).then(async (resp) => {
      const afterTime = Date.now();
      const data = await resp.json();
      const serverTime = new Date(data.datetime).getTime();

      responseDiff = (afterTime - beforeTime) / 2;
      timeDiff = serverTime + responseDiff - afterTime;
      diffViewArea.textContent = `この測定の誤差は±${
        responseDiff / 1000
      }秒です。`;
      reloadBtn.removeAttribute("disabled");

      if (alermSwitch.checked) {
        registrationAlerm();
      }
    });
  };

  /**
   * アラームの情報をローカルストレージに保存する
   */
  const registrationLocalStrage = () => {
    const inputs = alermTable.querySelectorAll("tr > td:first-child > input");
    const alermTimes = [...inputs].map((input) => input.value);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([alermTimes, alermSwitch.checked])
    );
  };

  // 時計の表示を更新するInterval
  setInterval(() => {
    const date = new Date(Date.now() + timeDiff);
    timeViewArea.textContent = `${("0" + date.getHours()).slice(-2)}:${(
      "0" + date.getMinutes()
    ).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}.${(
      "0" + Math.floor(date.getMilliseconds() / 10)
    ).slice(-2)}`;
  }, 10);

  // 時刻APIから差分を再取得するイベントリスナーの登録
  reloadBtn.addEventListener("click", () => {
    refleshDiff();
  });

  // アラームのデータをローカルストレージから取得し画面描写
  const storageItem = localStorage.getItem(STORAGE_KEY);
  const [alermData, alermFlag] = storageItem
    ? JSON.parse(storageItem)
    : [["08:30:00", "13:00:00", "19:00:00", "22:30:00"], false];
  const tableColumns = alermData.map(createTableColumn);
  tableColumns.forEach((column) => alermTable.appendChild(column));
  alermSwitch.checked = alermFlag;
  dispAlerm.checked = alermFlag;
  if (alermFlag) registrationAlerm();

  // アラームのオンオフを切り替えるイベントリスナーの登録
  alermSwitch.addEventListener("change", () => {
    dispAlerm.checked = alermSwitch.checked;
    if (alermSwitch.checked) {
      registrationAlerm();
    } else {
      timeoutIdList.forEach((id) => clearTimeout(id));
      timeoutIdList.length = 0;
      registrationLocalStrage();
    }
  });

  // アラームの行を追加するイベントリスナーの登録
  document.getElementById("addColumn").addEventListener("click", () => {
    alermTable.appendChild(createTableColumn(""));
  });

  // アラームの入力内容の確認と登録を行うイベントリスナーの登録
  alermTable.addEventListener("focusout", (e) => {
    const target = e.target;
    // inputエレメント以外のイベントはスルーï
    if (!(target instanceof HTMLInputElement)) return;
    const inputValue = target.value.trim();
    console.log(inputValue);
    // フォーマットチェック
    const errorFlg = (() => {
      if (!inputValue.match(/^\d{1,2}:\d{1,2}:\d{1,2}$/)) return true;
      const [h, m, s] = inputValue.split(":");
      if (h < 0 || 23 < h) return true;
      if (m < 0 || 59 < m) return true;
      if (s < 0 || 59 < s) return true;
      return false;
    })();
    if (errorFlg) {
      alert('時間は"hh:mm:ss"の形式で入力してください。');
      target.focus();
      return;
    }
    registrationAlerm();
  });

  document.getElementById("load").addEventListener("click", () => {
    new Audio("audio/silent.mp3").play();
  });

  refleshDiff();
});

const createTableColumn = (value) => {
  const tr = document.createElement("tr");
  const td1 = document.createElement("td");
  const td2 = document.createElement("td");

  const text = document.createElement("input");
  text.setAttribute("type", "text");
  text.value = value;
  td1.appendChild(text);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "削除";
  td2.appendChild(deleteButton);

  tr.appendChild(td1);
  tr.appendChild(td2);
  return tr;
};
