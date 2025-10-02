chrome.runtime.onInstalled.addListener(() => {
  console.log('FakeUser Manager extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    sendResponse({ authenticated: true });
  }
  return true;
});
