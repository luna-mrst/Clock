window.addEventListener('DOMContentLoaded', () => {
  const api = 'https://worldtimeapi.org/api/timezone/Asia/Tokyo'
  const timeViewArea = document.getElementById('timeViewArea')
  const diffViewArea = document.getElementById('diffViewArea')

  let timeDiff = 0;
  let responseDiff = 0;

  const refleshDiff = () => {
    const beforeTime = Date.now()
    fetch(api, {
      mode: 'cors'
    }).then(async resp => {
      const afterTime = Date.now()
      const data = await resp.json()
      const serverTime = new Date(data.datetime).getTime()

      responseDiff = (afterTime - beforeTime) / 2
      timeDiff = serverTime + responseDiff - afterTime
      diffViewArea.textContent = `この測定の誤差は±${responseDiff / 1000}秒です。`
    })
  }

  refleshDiff()

  setInterval(() => {
    const date = new Date(Date.now() + timeDiff)
    timeViewArea.textContent = `${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}.${('0' + Math.floor(date.getMilliseconds() / 10)).slice(-2)}`
  }, 10);

  document.getElementById('reload').addEventListener('click', () => {
    refleshDiff()
  })

})