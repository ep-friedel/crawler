var front = {};

document.addEventListener('DOMContentLoaded', () => {

front = {
    serverActions: {}
,   methods: {
    }
,   handler: {
        reader: {}
    ,   content: {}
    ,   menu: {}
    }
,   options: {
        server: 'http://crawler-fochlac.rhcloud.com/'
    }
,   chapters:[]
,   proto: {}
,   el: {
        body: document.querySelector('body')
    ,   reader: document.getElementById('reader')
    ,   readerList: document.getElementById('reader').children[0]
    ,   message: document.getElementById('message')
    ,   menu: document.getElementById('menu')
    ,   markReadButton: document.getElementById('markReadButton')
    ,   console: document.getElementById('console')
    ,   consoleButton: document.getElementById('hideConsole')
    ,   adminButton: document.getElementById('adminButton')
    ,   refreshButton: document.querySelector('.refresh')
    }
,   vars: {
        createdStoryElem:[]
    ,   fullChapterList: []
    ,   reference: []
    ,   startTrans: 0
    ,   keydownAllowed: true
    ,   currentStory: ''
    ,   startY: 0
    ,   startX: 0
    ,   confirmTimers: []
    ,   subscriptionList: []
    ,   deleteStash: []
}
};

front.handler.reader.toggleChapter = (shortName) => {
    const cse = front.vars.createdStoryElem[shortName];
    let unreadStories,
        ChapterElem = front.methods.getCurrentVisibleChapter(),
        ref;

    if (cse.content.classList.contains('hidden')) {
        Array.from(front.el.readerList.children).forEach((el) => {
            if (el.id !== shortName) {
                el.classList.add('hidden');
            }
        });
        cse.content.classList.remove('hidden');
        front.vars.currentStory = shortName;
        front.el.body.className = 'readerMode';
        front.el.refreshButton.classList.add('hidden');
        front.el.markReadButton.classList.remove('hidden');
    } else {
        ref = front.vars.reference[ChapterElem.id];
        front.methods.hideItem(ref);
        front.methods.menuMode(shortName);
    }
};

front.handler.content.keys = (event) => {
    const slide = front.handler.content.slide;
    var dir = 'l';

    if (event.type === "keyup") {
        switch(event.keyCode) {
            case 39:
                dir = 'r';
            case 37:
                if (document.querySelector('body').className === "readerMode") {
                    front.vars.startTrans = parseInt(front.vars.createdStoryElem[front.vars.currentStory].content.style.transform.split('(')[1]);
                    if (isNaN(front.vars.startTrans)) {
                        front.vars.startTrans = 0;
                    }
                    slide(dir);
                }
                break;
         }
    }
};

front.handler.content.markReadButton = (event) => {
    const elem  = front.methods.getCurrentVisibleChapter();
    let item;
    if (elem !== null) {
        item = front.vars.reference[elem.id];
        front.methods.markRead(item);
        front.methods.hideItem(item);
        if (front.methods.checkAllChaptersRead(item.short)) {
            if (front.vars.refresh)
                front.methods.refreshedChapterList();

            front.methods.menuMode(front.vars.currentStory);
        }
        front.methods.generateMarkReadMessage(elem.id);
    }
};

front.handler.content.scroll = (event) => {
    if (event.currentTarget.scrollTop  + event.currentTarget.offsetHeight + 100 > event.currentTarget.scrollHeight){
        front.methods.markRead(front.vars.reference[event.currentTarget.id]);
    }
};

front.handler.content.slide = (dir) => {
    const cseList     = front.vars.createdStoryElem[front.vars.currentStory].content,
          ChapterElem = front.methods.getCurrentVisibleChapter();
    let ref;

    if (ChapterElem !== null) {
        ref = front.vars.reference[ChapterElem.id];
        if (dir === 'l' ) {
            if (front.vars.startTrans + front.vars.screenX <= 0 ){
                front.methods.hideItem(ref);
                cseList.style.transform = 'translateX(' + (front.vars.screenX + front.vars.startTrans)  + 'px)';
            }
        } else if (dir === 'r') {
            if ((front.vars.screenX - front.vars.startTrans) < cseList.scrollWidth){
                if (!front.methods.hideItem(ref)) {
                    cseList.style.transform = 'translateX(' + (-front.vars.screenX + front.vars.startTrans)  + 'px)';
                }
            }
        }
    } else {
        front.methods.print("<p>Error: Cannot find Chapter Element.</p>");
    }
};

front.handler.content.touchstart = (event) => {
    const cseList = front.vars.createdStoryElem[front.vars.currentStory].content;

    front.vars.startTrans = parseInt(cseList.style.transform.split('(')[1]);
    if (isNaN(front.vars.startTrans)) {
        front.vars.startTrans = 0;
    }

    front.vars.startX = parseInt(event.touches[0].clientX);
    front.vars.startY = parseInt(event.touches[0].clientY);
};

front.handler.content.touchend = (event) => {
    const deltaY = front.vars.startY - parseInt(event.changedTouches[0].clientY)
    ,     deltaX = front.vars.startX - parseInt(event.changedTouches[0].clientX);

    if (deltaX > front.vars.screenX * 0.25){
        front.handler.content.slide('r');
    } else if (deltaX < front.vars.screenX * -0.25){
        front.handler.content.slide('l');
    }
};

front.handler.menu.fullReload = () => {
    location.reload();
};

front.handler.menu.gotoAdmin = (event) => {
    window.location.href = "/admin";
};

front.handler.menu.hideConsole = () => {
    front.methods.toggleConsole(false);
};

front.handler.menu.loadChapters = () => {
    const   story        =  front.vars.loadStorySelector.getValue(),
            startChapter =  front.vars.loadChapterSelector1.getValue(),
            endChapter   =  front.vars.loadChapterSelector2.getValue();

    front.methods.loadChapterList(story, startChapter, endChapter);

    //hide menu after starting to load the chapters
    front.handler.menu.show();
};

front.handler.menu.logout = (event) => {
    front.methods.confirm(event.currentTarget, front.methods.logout , 'logout');
};

front.handler.menu.markAllRead = (event) => {
    const dataUrl = (front.vars.markRead === 'chapter') ? ('?short=' + front.vars.markReadStorySelector.getValue()) : '';

    front.methods.confirm(event.currentTarget, front.serverActions.markAllRead, 'markAllRead', dataUrl);
};

front.handler.menu.markAllReadToggle = (event) => {
    const item = event.currentTarget;

    if (item.classList.contains('on')) {
        item.classList.remove('on');
        front.vars.markRead = "chapter";
        front.vars.markReadStorySelector.target.classList.remove('hideSoft');
    } else {
        item.classList.add('on');
        front.vars.markRead = "all";
        front.vars.markReadStorySelector.target.classList.add('hideSoft');
    }
};

front.handler.menu.resetStorage = (event) => {
    front.methods.confirm(event.currentTarget, front.methods.resetStorage, 'resetStorage');
};

front.handler.menu.show = (event) => {
    front.el.menu.classList.toggle('show');
};

front.handler.menu.toggleMinimized = (event) => {
    const elem = event.currentTarget.parentElement;
    elem.classList.toggle('minimized');
    elem.classList.toggle('expanded');
};

front.handler.menu.toggleSubscription = (event) => {
    const target = event.target;

    if (target.id) {
        let toggleButton = document.querySelector('.' + target.id + '.toggleButton');
        if (toggleButton) {
            front.serverActions.subscribe(target.id, toggleButton.classList.contains('on'));
            toggleButton.classList.toggle('on');
        }
    }
};

front.handler.focus = () => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({type: 'resetBase'});
    }
    front.methods.getChapterList();
};

front.handler.login = (event) => {
    var pass = document.getElementById('passwordInput'),
        user = document.getElementById('userInput');

    event.stopPropagation();
    event.preventDefault();

    front.methods.login(user.value, pass.value);
};

front.handler.message = (event) => {
    front.methods.getChapterList();
};

front.handler.reload = () => {
    front.methods.toggleConsole(true);
    front.methods.getChapterList()
        .then(() => {
            setTimeout(front.methods.toggleConsole, 1000, false);
        }).catch(err => console.warn('reload error', err));
};

front.handler.resize = () => {
    clearInterval(front.vars.resizer);

    front.vars.resizer = setInterval(front.methods.resizeWindow, 100);
}

front.handler.undoMarkRead = (id) => {
    var item = front.vars.reference[id],
        cse = front.vars.createdStoryElem[item.short];

    if (front.el.body.className === 'readerMode' && front.vars.currentStory !== item.short) {
        front.handler.reader.toggleChapter(front.vars.currentStory);
    }

    if (front.el.menu.classList.contains('show')) {
        front.el.menu.classList.remove('show');
    }

    if (cse.menu.classList.contains("hidden")) {
        front.handler.reader.toggleChapter(item.short);
    }
    item.elem.classList.remove('hidden');
    item.hidden = false;
    front.methods.unmarkRead(item);
    front.methods.checkAllChaptersRead(item.short);
};



front.methods.applyDeleteStash = () => {
    const ref = front.vars.reference,
          idList = front.vars.deleteStash;

    idList.forEach(id => {
        if (ref && ref[id] && ref[id].elem)
            ref[id].elem.remove();
    });
};

front.methods.checkAllChaptersRead = (shortName) => {
    const cse = front.vars.createdStoryElem[shortName];

    if ((cse.chapters.filter((chapter) => {return !chapter.read;})).length === 0) {
        cse.menu.classList.add('hidden', 'allRead');
        return true;
    } else if (cse.menu.classList.contains('allRead')) {
        cse.menu.classList.remove('hidden', 'allRead');
        return false;
    }
};

front.methods.checkForToken = () => {
    let jwt = localStorage.jwt,
        userString = (jwt && typeof(jwt) === 'string') ? jwt.split('.')[1] : undefined,
        userObj;

    if (userString) {
        userObj = atob(userString);
        front.vars.user = JSON.parse(userObj);
        front.el.reader.classList.remove('hideSoft');
        front.el.menu.classList.remove('hideSoft');
        front.el.console.classList.remove('hideSoft');
        front.el.consoleButton.classList.remove('hideSoft');
        front.el.body.className = 'menuMode';
        front.vars.jwt = jwt;
        navigator.serviceWorker.ready.then((registration) => {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({type: 'newJWT', jwt: jwt});
            }
        }).catch(err => console.warn('checkForToken error', err));
        front.initAfterLogin();
        document.getElementById('loginFrame').classList.add('hidden');
    }
};

front.methods.checkStoriesRead = () => {
    let unreadStories = Array.from(front.el.readerList.children).filter((el) => {
        if (!el.classList.contains('allRead')) return true;
    });

    if (unreadStories.length === 0) {
        front.el.message.innerText = "All Read!";
    } else {
        front.el.message.innerText = "";
    }

    return unreadStories;
};

front.methods.confirm = (item, action, tag, option) => {
    if (item.classList.contains('confirm')) {
        action(option);
        clearInterval(front.vars.confirmTimers[tag]);
        item.classList.remove('confirm');
    } else {
        item.classList.add('confirm');
        front.vars.confirmTimers[tag] = setInterval(() => {
            item.classList.remove('confirm');
            clearInterval(front.vars.confirmTimers[tag]);
        },5000);
    }
};

front.methods.defaultRequestHandling = (http, resolve, reject) => {
    if (http.readyState === 4) {
        switch(http.status) {
            case 200:
                resolve();
                break;
            case 279:
                front.methods.print('<p>Offline, request added to stack in Service Worker..</p>');
                resolve();
                break;
            case 401:
                front.methods.print('<p>Unauthorized: Logging Client out...</p>');
                front.methods.logout();
                reject();
                break;
            default:
                reject();
                break;
        }
    }
};

front.methods.generateMarkReadMessage = (id) => {
    front.vars.deleteStash.push(id);
    if (front.vars.undoMessage !== undefined && front.vars.undoMessage.f !== undefined && front.vars.undoMessage.f.exists() === true) {
        front.vars.undoMessage.e.message.innerHTML = front.vars.undoMessage.e.message.innerHTML.replace('onclick="', 'onclick="front.handler.undoMarkRead(\'' + id + '\');');
        front.vars.undoMessage.f.resetTimer();
    } else {
        front.vars.undoMessage = new front.proto.message({
            closeTimer: 10000,
            messageText: '<a href="#" onclick="front.handler.undoMarkRead(\'' + id + '\');front.vars.deleteStash=[];front.vars.undoMessage.f.destroy(); return false">Undo</a> the mark read?'
        });
        front.vars.undoMessage.f.onDestroy = front.methods.applyDeleteStash;
    }
};

front.methods.getChapter = (arr, addToNew) => {
    return new Promise((resolve, reject) => {
        let recursiveLoadingFunction = (index) => {
            let item = arr[index];
            if (typeof(item.short) !== 'undefined' && typeof(item.Chapter) !== 'undefined') {
                if (front.vars.reference[item.short + item.Chapter] === undefined) {
                front.serverActions.requestChapter(item, addToNew)
                    .then((response) => {
                        item.Content = response;
                        front.chapters.push(item);
                        item.read = false;
                        front.methods.renderChapter(item);
                    })
                    .catch((err) => {
                        front.methods.print('<p>Loading of item ' + item.short + item.Chapter + ' failed.</p>');
                    })
                    .then(() => {
                        index++;
                        if (index < arr.length) {
                            recursiveLoadingFunction(index);
                        } else {
                            resolve();
                        }
                    }).catch(err => console.warn('getChapter error', err));
                } else {
                    front.methods.renderChapter(item);
                    index++;
                    if (index < arr.length) {
                        recursiveLoadingFunction(index);
                    } else {
                        resolve();
                    }
                }
            } else {
            front.methods.print('<p>Loading of unknown item failed: Story and/or Chapter missing. ' + id + ',' + arr.length +'</p>');
            }
        };
        recursiveLoadingFunction(0);
    })
    .catch((err) => {
        console.log(err);
    })
    .then(() => {
        front.methods.checkStoriesRead();
        if (front.vars.markReadStorySelector) {
            front.vars.markReadStorySelector.newData(Array.from(new Set(front.chapters.map(x=>x.short))));
        }
    }).catch(err => console.warn('getChapter error', err));
};

front.methods.getChapterList = () => {
    return front.serverActions.getChapterList()
        .catch( (err) => {
            console.log(err);
        });
};

front.methods.getClosestChapter = (item) => {
    const cse = front.vars.createdStoryElem;
    let _arr1;

    _arr1 = cse[item.short].chapters.filter((obj) => {
        return (parseInt(obj.Chapter.toString().replace('.', '0000')) > parseInt(item.Chapter.toString().replace('.', '0000'))) ? true : false;
    });
    if (_arr1.length > 0) {
        _arr1.sort((a,b) => {
            return parseInt(a.Chapter.toString().replace('.', '0000')) - parseInt(b.Chapter.toString().replace('.', '0000'));
        });
        return _arr1.elem;
    } else {
        return false;
    }
};

front.methods.getCurrentVisibleChapter = () => {
    var currentElem = document.elementFromPoint(front.vars.screenX / 2, front.vars.screenY / 2);

    while (currentElem !== null && !currentElem.classList.contains('chapter')) {
        currentElem = currentElem.parentElement;
    }

    return currentElem;
};

front.methods.hideItem = (item) => {
    let cseList = front.vars.createdStoryElem[front.vars.currentStory].content;
    if (item !== undefined && item.read && !item.hidden) {
        item.elem.classList.add('hidden');
        item.hidden = true;
        front.methods.generateMarkReadMessage(item.short+item.Chapter);
        if ((front.vars.screenX - front.vars.startTrans) >= cseList.scrollWidth) {
            cseList.style.transform = 'translateX(' + (-cseList.scrollWidth + front.vars.screenX)  + 'px)';
        }
        return true;
    }
    return false;
};

front.methods.loadChapterList = (story, start, end) => {
    var arr1,
        arr2 = [];
    const fcl = front.vars.fullChapterList;
    arr1 = fcl[story].chapters.slice(fcl[story].chapters.indexOf(start), fcl[story].chapters.indexOf(end)+1);
    for (var i = 0; i < arr1.length; i++) {
        arr2.push({'short': story, 'Chapter': arr1[i], 'read': false});
    }
    front.methods.getChapter(arr2, true);
};

front.methods.login = (user, password, errorMessageInput) => {
    let errorMessage = errorMessageInput || 'Login-Error, Error Code: ';

    front.vars.busy = new front.proto.busyLayer();
    front.vars.busy.init();
    front.vars.loggingOut = false;

    return front.serverActions.login(user, password)
    .then((data) => {
        front.vars.busy.busyText.innerHTML = 'Initializing Service Worker';
        front.vars.user = JSON.parse(atob(data.token.split('.')[1]));
        front.vars.jwt =  data.token;
        localStorage.jwt = data.token;
        front.vars.reloadTimer = setInterval(() => location.reload(), 5000);
        navigator.serviceWorker.ready.then((registration) => {
            if (navigator.serviceWorker.controller) {
                clearInterval(front.vars.reloadTimer);
                navigator.serviceWorker.controller.postMessage({type: 'newJWT', jwt: data.token});
            }
        })
        .then(() => {
            front.vars.busy.busyText.innerHTML = 'Preparing application';
            document.getElementById('loginFrame').classList.add('hidden');
            front.el.reader.classList.remove('hideSoft');
            front.el.menu.classList.remove('hideSoft');
            front.el.console.classList.remove('hideSoft');
            front.el.consoleButton.classList.remove('hideSoft');
            front.el.body.className = 'menuMode';
            front.vars.busy.remove();
        })
        .then(front.initAfterLogin)
        .catch(err => console.warn('login error', err));
    })
    .catch((err) => {
        if (front.vars.loginMessage !== undefined &&
            front.vars.loginMessage.f !== undefined &&
            front.vars.loginMessage.f.exists() === true){

            front.vars.loginMessage.e.message.innerHTML = '<p>' + errorMessage + err + '</p>';
            front.vars.loginMessage.f.resetTimer();
        } else {
            front.vars.loginMessage = new front.proto.message({
                closeTimer: 5000,
                messageText: '<p>' + errorMessage + err + '</p>'
            });
        }
        if (front.vars.screenY  !== undefined) {
            front.methods.logout();
        }
        front.vars.busy.remove();
    });
};

front.methods.logout = () => {
    if (!front.vars.loggingOut) {
        front.vars.loggingOut = true;
        localStorage.removeItem('jwt');
        front.el.body.className = 'loginMode';
        clearInterval(front.checkServerTimer);
        front.vars.setupStatus = 'unregistered';
        document.getElementById('loginFrame').classList.remove('hidden');
        front.el.reader.classList.add('hideSoft');
        front.el.menu.classList.add('hideSoft');
        front.el.console.classList.add('hideSoft');
        front.el.consoleButton.classList.add('hideSoft');
        front.el.adminButton.classList.add('hidden');
        front.el.reader.firstElementChild.innerHTML="";
        front.chapters = [];
        front.vars.createdStoryElem = [];
        front.vars.currentStory = '';
        front.vars.newChapterList = undefined;
        front.vars.refreshedChapterList = [];
        front.vars.reference = [];
        front.vars.user = '';
        if (front.vars.undoMessage && front.vars.undoMessage.f && front.vars.undoMessage.destroy)
            front.vars.undoMessage.f.destroy();
        navigator.serviceWorker.ready.then((registration) => {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({type: 'deleteJWT'});
            }
        }).catch(err => console.warn('logout error', err));

        front.methods.unregisterSubscription();
    }
};

front.methods.markRead = (item) => {
    if (!item.read){
        item.read = true;
        front.serverActions.markRead(item)
            .catch(()=>{
                front.methods.print('<p>Mark Read of item ' + item.short + item.Chapter + 'failed. Retrying in 30 seconds...</p>');
                item.read = false;
                setTimeout(() => {front.methods.markRead(item);}, 30000);
            });
    }
};

front.methods.menuMode = (shortName) => {
    const cse = front.vars.createdStoryElem[shortName];

    front.methods.checkAllChaptersRead(shortName);
    cse.content.classList.add('hidden');
    front.vars.currentStory = '';
    front.el.body.className = 'menuMode';
    front.el.refreshButton.classList.remove('hidden');
    front.el.markReadButton.classList.add('hidden');

    unreadStories = front.methods.checkStoriesRead();
    unreadStories.forEach((el) => el.classList.remove('hidden'));
};

front.methods.newChapterList = () => {
    if (front.vars.newChapterList.length > 0) {
        front.el.message.innerText = "";
        front.vars.newChapterList = front.methods.sortChapters(front.vars.newChapterList);
        front.methods.getChapter(front.vars.newChapterList)
            .then(() => {
                front.methods.toggleConsole(false);
            }).catch(err => console.warn('newChapterList error', err));
    } else {
        front.methods.toggleConsole(false);
        front.el.message.innerText = "All Read!";
    }
};

front.methods.print = (text) => {
    const output = document.querySelector('.output');

    output.innerHTML += text;
    output.scrollTop = output.scrollHeight;
};

front.methods.refreshedChapterList = () => {
    let cse = front.vars.createdStoryElem,
        story;

    if (front.el.body.classList.contains('menuMode')) {
        for (story in cse){
            cse[story].menu.classList.add('hidden', 'allRead');
            cse[story].chapters.forEach((chapter) => {
                chapter.read = true;
                chapter.elem.classList.add('hidden');
                chapter.hidden = true;
            });
        };

        if (front.vars.refreshedChapterList.length > 0) {
            front.el.message.innerText = "";
            front.vars.refreshedChapterList = front.methods.sortChapters(front.vars.refreshedChapterList);
            front.methods.getChapter(front.vars.refreshedChapterList);
        } else {
            front.el.message.innerText = "All Read!";
        }
       for (story in cse){
            cse[story].menu.firstElementChild.removeEventListener('click', front.methods.refreshedChapterList);
        };
    } else {
        cse[front.vars.currentStory].menu.firstElementChild.addEventListener('click', front.methods.refreshedChapterList);
    }
};

front.methods.renderChapter = (item) => {
    const cse = front.vars.createdStoryElem,
          ref = front.vars.reference[item.short+item.Chapter];

    let closestChapterElem;


    if (cse[item.short] === undefined) {
        cse[item.short] = {menu: document.createElement('li')};
        cse[item.short].content = document.createElement('ul');
        cse[item.short].menu.innerHTML = '<p class="head">' + item.short + '</p>';
        cse[item.short].menu.id = item.short;
        cse[item.short].content.className = 'sublist hidden';
        front.el.readerList.appendChild(cse[item.short].menu);
        cse[item.short].menu.appendChild(cse[item.short].content);
        cse[item.short].menu.children[0].addEventListener('click', front.handler.reader.toggleChapter.bind(null, item.short), false);
        cse[item.short].content.addEventListener('touchend', front.handler.content.touchend, false);
        cse[item.short].content.addEventListener('touchstart', front.handler.content.touchstart, false);
        cse[item.short].chapters = [];
    }

    if ( ref === undefined || ref.elem === undefined) {
        item.elem = document.createElement('li');
        item.elem.id = item.short + item.Chapter;
        item.elem.className = 'chapter';
        item.elem.innerHTML = item.Content;
        item.hidden = false;
        front.vars.reference[item.short + item.Chapter] = item;
        closestChapterElem = front.methods.getClosestChapter(item);
        if (closestChapterElem) {
            cse[item.short].content.insertBefore(item.elem, closestChapterElem);
            cse[item.short].content.style.transform = 'translateX(0px)';
        } else {
            cse[item.short].content.appendChild(item.elem);
        }
        cse[item.short].chapters.push(item);
        item.elem.addEventListener('scroll', front.handler.content.scroll, false);
        front.methods.checkAllChaptersRead(item.short);

    } else {
        ref.read = false;
        ref.hidden = false;
        closestChapterElem = front.methods.getClosestChapter(item);
        if (closestChapterElem) {
            cse[item.short].content.insertBefore(ref.elem, closestChapterElem);
            cse[item.short].content.style.transform = 'translateX(0px)';
        } else {
            cse[item.short].content.appendChild(ref.elem);
        }
        cse[item.short].menu.classList.remove('allRead', (front.el.reader.className === 'readerMode') ? 'nonExistingClass' : 'hidden');
        ref.elem.classList.remove('hidden');
        front.methods.checkAllChaptersRead(item.short);
    }

    if (front.el.reader.className === 'readerMode'){
        cse[item.short].menu.classList.add('hidden');
    }
};

front.methods.resetCache = () => {
    navigator.serviceWorker.ready.then((registration) => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type: 'clearCache'});
        }
    }).catch(err => console.warn('logout error', err));
};

front.methods.resetStorage = () => {
    let jwt = localStorage.jwt;

    localStorage.clear();
    localStorage.jwt = jwt;
};

front.methods.resizeWindow = () => {
    const cse = front.vars.createdStoryElem,
          currentX = front.vars.screenX;
    var currentTrans,
        key;

    front.vars.screenY = parseInt(front.el.body.offsetHeight);
    front.vars.screenX = parseInt(front.el.body.offsetWidth);

    for (key in cse) {
        currentTrans = parseInt(cse[key].content.style.transform.split('(')[1]);
        cse[key].content.style.transform = 'translateX(' + (currentTrans * front.vars.screenX / currentX) + 'px)';
    }
    clearInterval(front.vars.resizer);
};

front.methods.sortChapters = (arr) => {
    return arr.sort((a,b) => {
            if (a.short !== b.short) {
                if (a.short < b.short) {
                    return -1;
                }
                if (a.short > b.short) {
                    return 1;
                }
                return 0;

            } else {
                return parseInt(a.Chapter.toString().replace('.', '0000')) - parseInt(b.Chapter.toString().replace('.', '0000'));
            }
            return 0;
        });
};

front.methods.toggleConsole = (show) => {
    const consoleElem = document.querySelector('.console'),
          hideConsole = document.querySelector('#hideConsole'),
          hide = (typeof(show) === "boolean") ? !show : consoleElem.classList.contains('popout');

    if (hide) {
        consoleElem.classList.remove('popout');
        hideConsole.classList.add('hidden');
    } else {
        consoleElem.classList.add('popout');
        hideConsole.classList.remove('hidden');
    }
};

front.methods.unmarkRead = (item) => {
    if (item.read){
        item.read = false;
        front.serverActions.markRead(item)
            .catch(()=>{
                item.read = true;
                front.methods.print('<p>Unmark Read of item ' + item.short + item.Chapter + 'failed.</p>');
            });
    }
};

front.methods.unregisterSubscription = () => {
    navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
            if (subscription) {
                front.serverActions.messagingKey(subscription, true);
            }
        });
    }).catch(err => console.warn('unregisterSubscription error', err));
};

front.methods.vibrate = () => {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

    if (navigator.vibrate) {
        navigator.vibrate([1000]);
    }
};


front.proto.busyLayer = function(options) {
    const self = this;
    let count = 0;
    self.options = {};

    self.init = () => {
        self.setOptions(options);
        self.render();
        self.append(self.options.target);
    };

    self.setOptions = (options) => {
        if (typeof(options) !== "object") options = {};
        self.options.message = options.message || 'Logging in';
        self.options.target = options.target || document.querySelector('body');
    };

    self.render = () => {
        let busyCenter = document.createElement('div');
        self.busyLayer = document.createElement('div');
        self.busyText = document.createElement('p');
        self.busyPoints = document.createElement('p');
        self.busyLayer.classList.add('busy');
        self.busyLayer.appendChild(busyCenter);
        busyCenter.appendChild(self.busyText);
        busyCenter.appendChild(self.busyPoints);
        self.busyText.innerHTML = self.options.message;
        self.busyPoints.innerHTML = '.';
    };

    self.animate = () => {
        if (count < 3) {
            self.busyPoints.innerHTML += '.';
            count++;
        } else {
            count = 0;
            self.busyPoints.innerHTML = '.';
        }
    };

    self.remove = () => {
        self.busyLayer.remove();
        clearInterval(self.timer);
    };

    self.append = (target) => {
        target.appendChild(self.busyLayer);
        self.timer = setInterval(self.animate, 500);
    };
};

front.proto.message = function (options) {
    const self = this;
    self.options = {};
    self.f = {};
    self.e = {};
    self.m = {};

    if (options === undefined) {
        options = {};
    }

    self.f.init = () => {
        self.f.setOptions();
        self.f.render();
        if (self.options.closeTimer > 0) {
            self.m.closeTimer = setInterval(() => {
                self.f.destroy();
            }, parseInt(self.options.closeTimer));
        }
    };

    self.f.render = () => {
        self.e.messageBody = document.createElement('div');
        self.e.closeButton = document.createElement('span');
        self.e.message = document.createElement('p');
        self.e.messageBody.className = 'message messageBody flexCol head';
        self.e.closeButton.className = 'message closeButton';
        self.e.message.innerHTML = self.options.messageText;
        self.options.target.appendChild(self.e.messageBody);
        self.e.messageBody.appendChild(self.e.message);
        self.e.messageBody.appendChild(self.e.closeButton);
        self.e.closeButton.appendChild(document.createElement('div'));
        self.e.closeButton.addEventListener('click', self.f.destroy);
    };

    self.f.setOptions = () => {
        self.options.messageText = options.messageText || 'No Text provided!';
        self.options.closeTimer = options.closeTimer || 0;
        self.options.target = options.target || document.querySelector('body');
    };

    self.f.exists = () => {
        return true;
    };

    self.f.resetTimer = () => {
        clearInterval(self.m.closeTimer);
        if (self.options.closeTimer > 0) {
            self.m.closeTimer = setInterval(() => {
                self.f.destroy();
            }, parseInt(self.options.closeTimer));
        }
    };


    self.f.onDestroy = () => {};

    self.f.destroy = () => {
        self.f.onDestroy();
        clearInterval(self.m.closeTimer);
        self.e.messageBody.remove();
        self.e = undefined;
        self.options = undefined;
        self.f = undefined;
        self.m = undefined;
    };

    self.f.init();
};

front.proto.picker = function(options, cb) {
    const self = this;
    self.options = {};

    self.init = () => {
        if (self._setOptions()) {
            self._render();
            self._registerListeners();
            self.initialized = true;
            self.currentId = self.list.children[0].innerText;
            if ( self.cb !== undefined) {
                self.cb(self.currentPosition, self.currentId);
            }
        }
    };


    self._setOptions = () =>{
        if (options.target !== undefined || options.data !== undefined){
            self.target = options.target;
            self.cb = cb;
            self.currentPosition = 0;
            self.options.factor = options.factor || 1;
            self.options.frameClass = options.frameClass || 'frame';
            self.options.tagClass = options.tagClass || 'tag';
            self.options.listClass = options.listClass || 'list';
            self.options.tag = options.tag || '';
            self.options.dataprop = options.dataprop || false;
            self.options.data = options.data;
            return true;
        }
        return false;
    };

    self._render = () => {
        self.frame = document.createElement('div');
        self.tag = document.createElement('span');
        self.list = document.createElement('ul');

        self.frame.className = self.options.frameClass;
        self.tag.className = self.options.tagClass;
        self.list.className =  self.options.listClass;

        self.target.appendChild(self.frame);
        self.frame.appendChild(self.tag);
        self.frame.appendChild(self.list);

        self.tag.innerText = self.options.tag;
        self._renderList();
    };

    self._renderList = () => {
        self.options.data.forEach((item, index) => {
            const elem = document.createElement('li');
            elem.innerText = (self.options.dataprop) ? item[self.options.dataprop] : item;
            self.list.appendChild(elem);
        });
        self.list.children[0].style.marginTop = '0px';
    };

    self._emptyList = () => {
        self.list.innerHTML = '';
    };

    self._registerListeners = () => {
        self.list.addEventListener('touchstart', self._touchstart, false);
        self.list.addEventListener('touchmove', self._touchmove, false);
        self.list.addEventListener('touchend', self._touchend, false);
        self.list.addEventListener('mousedown', self._mousedown, false);
    };

    self._mousedown = (event) => {
        event.stopPropagation();
        event.preventDefault();

        self.startTrans = self.getMarginTop();
        self.startX = parseInt(event.clientX);
        self.startY = parseInt(event.clientY);
        document.querySelector('body').addEventListener('mousemove', self._mousemove, false);
        document.querySelector('body').addEventListener('mouseup', self._mouseup, false);
        document.querySelector('body').addEventListener('mouseout', self._mouseout, false);
    };

    self._mouseup = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const position = -Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height);

        if (position !== self.currentPosition && self.cb !== undefined){
            self.currentPosition = position;
            self.currentId = self.list.children[-Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height)].innerText;
            self.cb(position, self.currentId);
        }
        document.querySelector('body').removeEventListener('mousemove', self._mousemove);
        document.querySelector('body').removeEventListener('mouseup', self._mouseup);
        document.querySelector('body').removeEventListener('mouseout', self._mouseout);
    };

    self._mouseout = (event) => {
        if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
            self._mouseup(event);
        }
    };

    self._mousemove = (event) => {
        event.stopPropagation();
        event.preventDefault();

        self.currentY = parseInt(event.clientY);
        self._moveFunction(event.clientY);
    };

    self._moveFunction = (clientY) => {
        var deltaY = self.startY - self.currentY
        ,   listElemHeight = self.list.children[0].getBoundingClientRect().height
        ,   maxHeight = -self.list.scrollHeight + self.getMarginTop() + listElemHeight*2
        ,   factor = deltaY * 4 / window.innerHeight
        ,   move = -(factor * factor * factor * self.options.factor) * -maxHeight + self.startTrans
        ,   smoothMove = Math.round(move / listElemHeight) * listElemHeight
        ,   smoothMax = Math.round(maxHeight / listElemHeight) * listElemHeight;

        if (move < 0 && smoothMove >= smoothMax) {
            self.list.children[0].style.marginTop = smoothMove + 'px';
        } else {
            self.list.children[0].style.marginTop = (move >= 0) ? '0' : smoothMax + 'px';
            self.startY = parseInt(clientY);
            self.startTrans = self.getMarginTop();
        }
    };

    self._touchstart = (event) => {

        event.stopPropagation();
        event.preventDefault();

        self.startTrans = self.getMarginTop();
        self.startX = parseInt(event.touches[0].clientX);
        self.startY = parseInt(event.touches[0].clientY);
    };

    self._touchmove = (event) => {
        event.stopPropagation();
        event.preventDefault();

        self.currentY = parseInt(event.touches[0].clientY);
        self._moveFunction(event.touches[0].clientY);
    };

    self._touchend = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const position = -Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height);
        if (position !== self.currentPosition && self.cb !== undefined){
            self.currentPosition = position;
            self.currentId = self.list.children[-Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height)].innerText;
            self.cb(position, self.currentId);
        }
    };

    self.newData = (data, dataprop) => {
        if (self.initialized) {
            self.options.dataprop = dataprop || false;
            self.options.data = data;
            self._emptyList();
            self._renderList();
        } else if (data.length > 0) {
            options.dataprop = dataprop || false;
            options.data = data;
            self.init();
        }
    };

    self.goto = (pos) => {
        if (pos === undefined || isNaN(parseInt(pos))|| (pos <= 0 && pos >= self.options.data.length)) {
            return false;
        }
        self.list.children[0].style.marginTop = -parseInt(pos) * self.list.children[0].getBoundingClientRect().height + 'px';
        return true;
    };

    self.getMarginTop = () => {
        var marginTop = parseInt(self.list.children[0].style.marginTop);
        return (isNaN(marginTop)) ? 0 : marginTop;
    };

    self.getValue = () => {
        return self.list.children[-Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height)].innerText;
    };

    self.getPosition = () => {
        return Math.round(self.getMarginTop() / self.list.children[0].getBoundingClientRect().height);
    };

    self._setOptions();

    if (self.options.data.length > 0 || self.options.target !== undefined){
        self.init();
    }
};


front.serverActions.getChapterList = () => {
    const http = new XMLHttpRequest(),
          connectionElem = document.querySelector('.connection'),
          arrowElem = document.querySelector('.connection .arrow'),
          arrowBackElem = document.querySelector('.connection .arrow.back'),
          serverElem = document.querySelector('.connection .server'),
          arrows = document.querySelector('.connection .arrows'),
          statusElem = document.querySelector('.connection .status');

    arrowElem.className += ' animated';
    serverElem.className += ' yellow';
    statusElem.className += ' yellow';
    arrowBackElem.className += ' hideSoft';
    arrowElem.className = arrowElem.className.replace(/hideSoft|completed/g, '');
    statusElem.className = statusElem.className.replace(/red|green/g, '');
    serverElem.className = serverElem.className.replace(/red|green/g, '');

    return new Promise((resolve, reject) => {
        http.open('GET', '/api/getNewChapterList', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            switch(http.readyState){
                case 2:
                    arrowElem.className += ' completed';
                    arrowBackElem.className += ' animated';
                    serverElem.className += ' green';
                    arrowElem.className = arrowElem.className.replace(/animated/g, '');
                    arrowBackElem.className = arrowBackElem.className.replace(/hideSoft|completed/g, '');
                    serverElem.className = serverElem.className.replace(/red|yellow/g, '');
                    break;

                case 4:
                    let now = new Date(),
                        timestamp = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

                    timestamp = timestamp.replace(/([:]?\D)(\d)\b/g, '$10$2');

                    arrows.setAttribute('data-content', timestamp);
                    if (http.status === 200) {
                        if (front.vars.newChapterList === undefined) {
                            front.vars.newChapterList = JSON.parse(http.response);
                            front.vars.chapterListVersion = (front.vars.newChapterList && front.vars.newChapterList.length > 0) ? front.vars.newChapterList[0].new : 0;

                            front.methods.newChapterList();
                        } else {
                            front.vars.refreshedChapterList = JSON.parse(http.response);

                            if (front.vars.refreshedChapterList &&
                                front.vars.refreshedChapterList.length > 0 &&
                                front.vars.refreshedChapterList[0].new > front.vars.chapterListVersion){

                                front.vars.chapterListVersion = front.vars.refreshedChapterList[0].new;
                                front.methods.refreshedChapterList();

                            } else if (front.vars.refreshedChapterList &&
                                front.vars.refreshedChapterList.length === 0) {

                                front.methods.refreshedChapterList();
                            }
                        }
                        arrowBackElem.className += ' completed';
                        statusElem.className += ' green';
                        arrowBackElem.className = arrowBackElem.className.replace(/animated/g, '');
                        statusElem.className = statusElem.className.replace(/red|yellow/g, '');
                        resolve();
                    } else {
                        arrowBackElem.className += ' completed';
                        statusElem.className += ' red';
                        serverElem.className += ' red';
                        arrowBackElem.className = arrowBackElem.className.replace(/animated/g, '');
                        statusElem.className = statusElem.className.replace(/green|yellow/g, '');
                        serverElem.className = serverElem.className.replace(/green|yellow/g, '');
                        if (http.status === 401) {
                            front.methods.print('<p>Unauthorized: Logging Client out...</p>');
                            front.methods.logout();
                            reject();
                        }
                        resolve();
                    }
            }
        };
        http.onerror = () => {
            statusElem.className += ' red';
            serverElem.className += ' yellow';
            arrowBackElem.className = arrowElem.className.replace(/animated/g, '');
            statusElem.className = statusElem.className.replace(/green|yellow/g, '');
            serverElem.className = serverElem.className.replace(/green|red/g, '');
            resolve();
        };
        http.send();
    });
};

front.serverActions.getFullChapterList = () => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        http.open('GET', '/api/requestFullChapterList', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            switch(http.readyState){
                case 2:
                    front.methods.print('<p>Requesting list of all Chapters: Request sent.</p>');
                    break;

                case 4:
                    if (http.status === 200) {
                        front.vars.fullChapterList = JSON.parse(http.response.replace(/{"Chapter":(.*?)}/g, '$1'));
                        front.vars.fullChapterList.forEach((item) => {
                            item.chapters.sort((a,b) => {

                                if (a.toString().indexOf('.') === -1) {
                                    return parseInt(a) - parseInt(b);

                                } else if (a.toString().indexOf('.') !== -1) {

                                    if (a.split('.')[0] === b.split('.')[0]){
                                        return parseInt(a.split('.')[1]) - parseInt(b.split('.')[1]);

                                    } else {
                                        return parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]);
                                    }
                                }
                            });
                            front.vars.fullChapterList[item.short] = item;
                            front.vars.fullChapterList[item.short].chapters = front.vars.fullChapterList[item.short].chapters.map((item) => {return item.toString();});
                        });
                        front.methods.print('<p>Requesting list of all Chapters: Success.</p>');
                        resolve();
                    } else {
                        front.methods.print('<p>Requesting list of all Chapters: Failed.</p>');
                        if (http.status === 401) {
                            front.methods.print('<p>Unauthorized: Logging Client out...</p>');
                            front.methods.logout();
                        }
                        reject();
                    }
            }
        };
        http.send();
    });
};

front.serverActions.getSubscriptionList = () => {
    const http = new XMLHttpRequest(),
        url = '/api/subscribeSeries';

        return new Promise((resolve, reject) => {
            http.open('GET', url, true);
            http.setRequestHeader("Cache-Control", "no-Cache");
            http.setRequestHeader("jwt", front.vars.jwt);
            http.onreadystatechange = (event, res) => {
                if (http.readyState === 4) {
                    if (http.status === 200){
                        front.vars.subscriptionList = JSON.parse(http.response);
                        resolve();
                    } else {
                        reject(http.status);
                    }
                }
            };
            http.send();
        });
};

front.serverActions.login = (user, password) => {
    const http = new XMLHttpRequest(),
        url = '/login',
        datastring = 'user=' + user + '&password=' + password;

        return new Promise((resolve, reject) => {
            http.open('POST', url, true);
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            http.onreadystatechange = (event, res) => {
                if (http.readyState === 4) {
                    if (http.status === 200){
                        resolve(JSON.parse(http.response));
                    } else {
                        reject(http.status);
                    }
                }
            };
            http.send(datastring);
        });
};

front.serverActions.markAllRead = (data) => {
    const http = new XMLHttpRequest(),
          url = '/api/markAllRead' + data;

    return new Promise((resolve, reject) => {
        http.open('PUT', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send();
    });
};

front.serverActions.markRead = (item) => {
    const http = new XMLHttpRequest(),
          url = '/api/markRead?short=' + item.short + '&chapter=' + item.Chapter + '&read=' + item.read;

    return new Promise((resolve, reject) => {
        http.open('PUT', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send();
    });
};

front.serverActions.markNew = (item) => {
    const http = new XMLHttpRequest(),
          url = '/api/markNew?short=' + item.short + '&chapter=' + item.Chapter + '&read=' + item.read;

    return new Promise((resolve, reject) => {
        http.open('PUT', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send();
    });
};

front.serverActions.messagingKey = (subscription, deleteKey) => {
    const http = new XMLHttpRequest(),
          url = '/api/messageKey',
          data = JSON.stringify(subscription),
          method = deleteKey ? 'DELETE' : 'POST';

    return new Promise((resolve, reject) => {
        http.open(method, url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.setRequestHeader("Content-Type", "application/json");
        http.onreadystatechange = () => {
            if (deleteKey) {
                front.methods.defaultRequestHandling(http, resolve, resolve);
            } else {
                front.methods.defaultRequestHandling(http, resolve, reject);
            }
        };
        http.send(data);
    });
};

front.serverActions.requestChapter = (item, addToNew) => {
    const   http = new XMLHttpRequest(),
            url = '/api/requestChapter' + '?short=' + item.short + '&chapter=' + item.Chapter + '&addToNew=' + (addToNew ? addToNew : false);
    let chapterDbController;

    return new Promise((resolve, reject) => {
        if (localStorage[item.short+item.Chapter] !== undefined && localStorage[item.short+item.Chapter].length >= 1000) {
        	if (addToNew)
        		front.serverActions.markNew(item);

            resolve(localStorage[item.short+item.Chapter]);
        } else {
            http.open('GET', url, true);
            http.setRequestHeader("jwt", front.vars.jwt);
            http.addEventListener("progress", (event) => {
                front.methods.print('<p>Loading:' + item.short + '-' + item.Chapter + ': ' + Math.round(event.loaded / event.total * 100) + '%</p>');
            });
            http.onreadystatechange = (event, res) => {
                switch(http.readyState){
                    case 2:
                        front.methods.print('<p>Requesting:' + item.short + '-' + item.Chapter + ': Request sent.</p>');
                        break;

                    case 4:
                        if (http.status === 200) {

                            if (localStorage['timestamps']) {
                                chapterDbController = JSON.parse(localStorage['timestamps']);
                                chapterDbController.push({
                                    timestamp: new Date().getTime(),
                                    key: item.short+item.Chapter
                                });
                                localStorage['timestamps'] = JSON.stringify(chapterDbController);
                            } else {
                                localStorage['timestamps'] = JSON.stringify([{timestamp: new Date().getTime(), key: item.short+item.Chapter}]);
                            }
                            try {
                                localStorage[item.short+item.Chapter] = http.responseText;
                            }
                            catch (e) {
                                front.methods.print('<p>Error storing Chapter "' + item.short + '-' + item.Chapter + '" in local Storage.</p>');
                            }

                            front.methods.print('<p>Requesting:' + item.short + '-' + item.Chapter + ': Success.</p>');
                            resolve(http.responseText);
                        } else {
                            front.methods.print('<p>Requesting:' + item.short + '-' + item.Chapter + ': Failed. Error Code: ' + http.status + '</p>');
                            if (http.status === 401) {
                                front.methods.print('<p>Unauthorized: Logging Client out...</p>');
                                front.methods.logout();
                            }
                            reject();
                        }
                }
            };
            http.send();
        }

    });
};

front.serverActions.subscribe = (short, unsubscribe) => {
    const http = new XMLHttpRequest(),
        url = '/api/subscribeSeries',
        datastring = 'short=' + short,
        action = (unsubscribe) ? 'DELETE' : 'POST';

    return new Promise((resolve, reject) => {
        http.open(action, url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send(datastring);
    });
};


front.init = () => {
    front.methods.checkForToken();
    document.querySelector('#loginButton').addEventListener('click', front.handler.login);
};

front.createSubscriptionList = (fullChapterList, subscriptionList) => {
    const l = document.getElementById('subsList'),
          lParent = l.parentElement;


    Promise.all([fullChapterList, subscriptionList]).then(() => {
        l.remove();
        front.vars.fullChapterList.forEach((story) => {
            let listElem = document.createElement('li');
            listElem.innerHTML = '<div class="flexRow" id="' + story.short +
                '"><label for="" id="' + story.short +
                '">' + story.short +
                '</label><div id="' + story.short +
                '" class="' + story.short +
                ' toggleButton ' + ((front.vars.subscriptionList.includes(story.short)) ? 'on' : '') +
                '"><span id="' + story.short +
                '"></span></div></div>';
            l.appendChild(listElem);
        });
        lParent.appendChild(l);
        l.addEventListener('click', front.handler.menu.toggleSubscription);
    }).catch(err => console.warn('createSubscriptionList error', err));
};

front.setupSliders = (chapterList, fullChapterList) => {
    chapterList.then(() => {
       const mrb = document.querySelector('#markAllReadButton');
        if (front.vars.markReadStorySelector === undefined) {
            front.vars.markReadStorySelector = new front.proto.picker({
                target: document.querySelector('#markReadStoryPicker')
            ,   frameClass: 'storypicker full flexRow'
            ,   tagClass: 'storyTag'
            ,   listClass: 'story list'
            ,   tag: 'Select Story:'
            ,   data: Array.from(new Set(front.vars.newChapterList.map(x => x.short)))
                });

            mrb.addEventListener('click', front.handler.menu.markAllRead, false);
            document.querySelector('#markAllRead .toggleButton').addEventListener('click', front.handler.menu.markAllReadToggle, false);
        } else {
            front.vars.markReadStorySelector.newData(Array.from(new Set(front.vars.newChapterList.map(x => x.short))));
        }
    }).catch(err => console.log(err));

    fullChapterList.then(() => {
        const loadStoryButton = document.querySelector('#loadChapters');
        if (front.vars.loadStorySelector === undefined) {
            front.vars.loadStorySelector = new front.proto.picker({
                target: document.querySelector('#loadStoryPicker')
            ,   frameClass: 'storypicker1 flexCol'
            ,   tagClass: 'storyTag'
            ,   listClass: 'story list full'
            ,   tag: 'Story:'
            ,   data: front.vars.fullChapterList
            ,   dataprop: 'short'
                },(position, value)=>{
                    if (front.vars.loadChapterSelector1 === undefined || front.vars.loadChapterSelector2 === undefined) return;
                    front.vars.loadChapterSelector1.newData(front.vars.fullChapterList[position].chapters);
                    front.vars.loadChapterSelector2.newData(front.vars.fullChapterList[position].chapters);
                    front.vars.loadChapterSelector2.goto(front.vars.fullChapterList[position].chapters.length-1);
            });
        }
        if (front.vars.loadChapterSelector1 === undefined) {

            front.vars.loadChapterSelector1 = new front.proto.picker({
                target: document.querySelector('#loadStoryPicker')
            ,   frameClass: 'chapterpicker1 flexCol'
            ,   tagClass: 'chapterTag'
            ,   listClass: 'chapter list full'
            ,   tag: 'Start:'
            ,   data: front.vars.fullChapterList[0].chapters
            ,   factor: 1
                }, (position) => {
                    if (front.vars.loadChapterSelector2 === undefined) return;
                    var pos = -front.vars.loadChapterSelector2.getPosition();

                    if (position >= pos) {
                        front.vars.loadChapterSelector2.goto(position);
                    }
            });
        }
        if (front.vars.loadChapterSelector2 === undefined) {

            front.vars.loadChapterSelector2 = new front.proto.picker({
                target: document.querySelector('#loadStoryPicker')
            ,   frameClass: 'chapterpicker2 flexCol'
            ,   tagClass: 'chapterTag'
            ,   listClass: 'chapter list full'
            ,   tag: 'End:'
            ,   data: front.vars.fullChapterList[0].chapters
            ,   factor: 1
                }, (position) => {
                    if (front.vars.loadChapterSelector1 === undefined) return;
                    var pos = -front.vars.loadChapterSelector1.getPosition();

                    if (position <= pos) {
                        front.vars.loadChapterSelector1.goto(position);
                    }
            });

            front.vars.loadChapterSelector2.goto(front.vars.fullChapterList[0].chapters.length-1);
            loadStoryButton.className = loadStoryButton.className.replace(' inactive', '');
            loadStoryButton.addEventListener('click', front.handler.menu.loadChapters, false);
        }
    }).catch(err => console.log(err));
};

front.registerServiceWorker = () => {
    let swRegistration;

    if (navigator.onLine) {
        navigator.serviceWorker.register('service-worker.js')
        .then(() => {
            return navigator.serviceWorker.ready;
        })
        .then((registration) => {
            swRegistration = registration;
            return registration.pushManager.getSubscription();
        })
        .then((subscription) => {
            return (subscription) ? subscription : swRegistration.pushManager.subscribe({userVisibleOnly: true});
        })
        .then((subscription) => {
            return front.serverActions.messagingKey(subscription, false);
        })
        .catch(err => console.warn('registerServiceWorker error', err));
    }
};

front.registerListeners = () => {
    const h = front.handler,
          m = h.menu;

    document.querySelector('#markReadButton').addEventListener('click', front.handler.content.markReadButton, false);
    document.querySelector('#loadStory').firstElementChild.addEventListener('click', m.toggleMinimized);
    document.querySelector('#markAllRead').firstElementChild.addEventListener('click', m.toggleMinimized);
    document.querySelector('#manageSubs').firstElementChild.addEventListener('click', m.toggleMinimized);
    front.el.console.firstElementChild.addEventListener('click', m.toggleMinimized);
    document.querySelector('#logoutButton').addEventListener('click', m.logout);
    document.querySelector('#reloadPageButton').addEventListener('click', m.fullReload);
    document.querySelector('#resetStorageButton').addEventListener('click', m.resetStorage);
    document.querySelector('#hideConsole').addEventListener('click', m.hideConsole);
    document.querySelector('#reload').addEventListener('click', front.handler.reload);
    document.addEventListener('keyup', h.content.keys, false);
    document.addEventListener('keydown', h.content.keys, false);
    front.el.menu.children[0].addEventListener('click', m.show);
    navigator.serviceWorker.addEventListener('message', h.message);
    document.addEventListener('visibilitychange', front.handler.focus);
};

front.initAfterLogin = () => {
    let chapterDbController,
        chapterArray,
        timestamp = new Date().getTime();
    front.registerServiceWorker();

    if (front.vars.setupStatus !== 'initialized') {
        front.vars.setupStatus = 'initialized';
        const chapterList = front.serverActions.getChapterList(),
             fullChapterList = front.serverActions.getFullChapterList(),
             subscriptionList = front.serverActions.getSubscriptionList();

        front.setupSliders(chapterList, fullChapterList);
        front.createSubscriptionList(fullChapterList, subscriptionList);
        front.registerListeners();

        chapterList.then(() => {
            chapterArray = front.vars.newChapterList.reduce((list, item) => {
                list.push(item.short+item.Chapter);
                return list;
            }, []);

            // clean local storage
            chapterDbController = JSON.parse(localStorage.timestamps);
            chapterDbController = chapterDbController.filter((item) => {
                if (item.timestamp + 604800000 < timestamp && !chapterArray.includes(item.key)) {
                    localStorage[item.key] = undefined;
                    return false;
                }
                return true;
            });
            localStorage.timestamps = JSON.stringify(chapterDbController);
        })
    } else {
        front.methods.getChapterList();
    }

    front.vars.screenY = parseInt(front.el.body.offsetHeight);
    front.vars.screenX = parseInt(front.el.body.offsetWidth);

    if (front.vars.user.role === "admin") {
        front.el.adminButton.addEventListener('click', front.handler.menu.gotoAdmin);
        front.el.adminButton.classList.remove('hidden');
    }

};

window.onresize = () => {

};

front.init();

});