let running = false;
let count = 0;
let username = '';

const delay = ms => new Promise(r => setTimeout(r, ms));

function sendUpdate(status) {
  chrome.runtime.sendMessage({ type: 'UPDATE', count, status });
}

function sendDone() {
  chrome.runtime.sendMessage({ type: 'DONE', count });
}

// ─── FIND DELETE OPTION ───────────────────────────────────────────────
const findDelete = () => {
  return [...document.querySelectorAll('div, span')]
    .find(el =>
      el.childElementCount === 0 &&
      el.innerText.trim() === "Delete" &&
      el.closest('[role="menuitem"]')
    );
};

// ─── DELETE TWEETS ────────────────────────────────────────────────────
async function deleteTweets() {
  let sameHeightCount = 0;

  while (running) {
    window.scrollTo(0, 0);
    await delay(2000);
    sendUpdate("Scanning for tweets...");

    const menuBtns = [...document.querySelectorAll('button[aria-label="More"]')]
      .filter(btn => btn.closest('article'));

    console.log(`Found ${menuBtns.length} menu buttons`);

    let actionTaken = false;

    if (menuBtns.length) {
      for (let btn of menuBtns) {
        if (!running) break;
        btn.click();
        await delay(1200);

        const deleteOption = findDelete();
        if (deleteOption) {
          sendUpdate("Deleting tweet...");
          deleteOption.click();
          await delay(1000);

          const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
          if (confirmBtn) {
            confirmBtn.click();
            count++;
            sendUpdate(`Deleted tweet #${count} ✓`);
            sameHeightCount = 0;
            await delay(3000);
            actionTaken = true;
            break;
          }
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          await delay(300);
        }
      }
    }

    if (!actionTaken) {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await delay(3000);

      if (document.body.scrollHeight === currentHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 5) { sendDone(); running = false; break; }
      } else {
        sameHeightCount = 0;
      }
    }

    await delay(2000);
  }
}

// ─── UNDO RETWEETS ────────────────────────────────────────────────────
async function undoRetweets() {
  let sameHeightCount = 0;

  while (running) {
    sendUpdate("Scanning for retweets...");

    const retweetBtns = [...document.querySelectorAll('button[data-testid="unretweet"]')];
    console.log(`Found ${retweetBtns.length} retweet buttons`);

    if (retweetBtns.length) {
      for (let btn of retweetBtns) {
        if (!running) break;
        btn.click();
        await delay(1000);

        const undoBtn = [...document.querySelectorAll('span')]
          .find(el => el.childElementCount === 0 && el.innerText.trim() === "Undo repost");

        if (undoBtn) {
          undoBtn.click();
          count++;
          sendUpdate(`Undid repost #${count} ✓`);
          sameHeightCount = 0;
          await delay(1500);
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          await delay(300);
        }
      }
    } else {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await delay(3000);

      if (document.body.scrollHeight === currentHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 5) { sendDone(); running = false; break; }
      } else {
        sameHeightCount = 0;
      }
    }

    await delay(1000);
  }
}

// ─── REMOVE LIKES ─────────────────────────────────────────────────────
async function removeLikes() {
  let sameHeightCount = 0;

  while (running) {
    sendUpdate("Scanning for likes...");

    const likeBtns = [...document.querySelectorAll('button[data-testid="unlike"]')];
    console.log(`Found ${likeBtns.length} liked tweets`);

    if (likeBtns.length) {
      for (let btn of likeBtns) {
        if (!running) break;
        btn.click();
        count++;
        sendUpdate(`Removed like #${count} ✓`);
        await delay(1000);
      }
      sameHeightCount = 0;
    } else {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await delay(3000);

      if (document.body.scrollHeight === currentHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 5) { sendDone(); running = false; break; }
      } else {
        sameHeightCount = 0;
      }
    }

    await delay(1000);
  }
}

// ─── DELETE REPLIES ───────────────────────────────────────────────────
async function deleteReplies() {
  let sameHeightCount = 0;

  const getMyReplyButtons = () => {
    return [...document.querySelectorAll('button[aria-label="More"]')]
      .filter(btn => {
        const article = btn.closest('article');
        if (!article) return false;
        return [...article.querySelectorAll('a')]
          .some(a => a.href.includes(username));
      });
  };

  while (running) {
    // Scroll to top then slowly down to trigger lazy loading
    window.scrollTo(0, 0);
    await delay(1500);

    for (let i = 1; i <= 5; i++) {
      window.scrollTo(0, window.innerHeight * i * 0.8);
      await delay(600);
    }
    window.scrollTo(0, 0);
    await delay(1500);

    sendUpdate("Scanning for your replies...");

    const myBtns = getMyReplyButtons();
    console.log(`Found ${myBtns.length} your reply buttons`);

    let actionTaken = false;

    if (myBtns.length) {
      for (let btn of myBtns) {
        if (!running) break;

        // Make sure button is still in DOM
        if (!document.body.contains(btn)) continue;

        btn.click();
        await delay(1200);

        const deleteOption = findDelete();
        if (deleteOption) {
          sendUpdate("Deleting reply...");
          deleteOption.click();
          await delay(1000);

          const confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
          if (confirmBtn) {
            confirmBtn.click();
            count++;
            sendUpdate(`Deleted reply #${count} ✓`);
            sameHeightCount = 0;
            await delay(4000); // Wait longer for DOM to settle
            actionTaken = true;
            break; // Restart loop immediately after each deletion
          }
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          await delay(400);
        }
      }
    }

    if (!actionTaken) {
      const currentHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await delay(4000);

      if (document.body.scrollHeight === currentHeight) {
        sameHeightCount++;
        console.log(`Page height unchanged (${sameHeightCount}/8)`);
        sendUpdate(`Checking for more... (${sameHeightCount}/8)`);

        if (sameHeightCount >= 8) { sendDone(); running = false; break; }

        // Scroll back to top and wait before retrying
        window.scrollTo(0, 0);
        await delay(3000);
      } else {
        sameHeightCount = 0;
      }
    }

    await delay(1500);
  }
}

// ─── MESSAGE LISTENER ─────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'START') {
    running = true;
    count = 0;
    username = msg.username;

    if (msg.action === 'tweets') deleteTweets();
    if (msg.action === 'retweets') undoRetweets();
    if (msg.action === 'likes') removeLikes();
    if (msg.action === 'replies') deleteReplies();
  }

  if (msg.type === 'STOP') {
    running = false;
  }
});
