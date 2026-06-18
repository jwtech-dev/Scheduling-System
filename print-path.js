const { app } = require('electron');
app.whenReady().then(() => {
  console.log('App Name:', app.name);
  console.log('User Data Path:', app.getPath('userData'));
  app.quit();
});
