console.log('hello from electron')

const { app, BrowserWindow } = require('electron')

const createStreamingWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('streaming.html')
  return win;
}

const createReceiverWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
      })
    
      win.loadFile('receiver.html')
      return win;
}

const copyCanvas = () = {
    newCanvas.drawImage(oldCanvas, 0, 0, width, height)
}

app.whenReady().then(() => {
  strwin = createStreamingWindow();
  recwin = createReceiverWindow();
  strwin.webContents
})
