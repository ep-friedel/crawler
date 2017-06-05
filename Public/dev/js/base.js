var front = {};

document.addEventListener('DOMContentLoaded', () => {

front = {
    serverActions: {}
,   methods: {
    }
,   tools: {
    }
,   handler: {
        reader: {}
    ,   content: {}
    ,   menu: {}
    }
,   options: {
        server: 'https://crawler.fochlac.com'
    }
,   chapters:[]
,   proto: {}
,   el: {
        body: document.querySelector('body')
    ,   reader: document.getElementById('reader')
    ,   readerList: document.getElementById('reader').children[0]
    ,   message: document.getElementById('message')
    ,   menu: document.getElementById('menu')
    ,   sound: document.getElementById('sound')
    ,   toggleSound: document.getElementById('toggleSound')
    ,   toggleVibrate: document.getElementById('toggleVibrate')
    ,   markReadButton: document.getElementById('markReadButton')
    ,   adminButton: document.getElementById('adminButton')
    ,   refreshButton: document.querySelector('.refresh')
    ,   statusRow: document.querySelector('#status')
    }
,   vars: {
        confirmTimers: []
    ,   createdStoryElem:{}
    ,   currentStory: ''
    ,   deleteStash: []
    ,   freshList: false
    ,   fullChapterList: []
    ,   keydownAllowed: true
    ,   loadingState: {}
    ,   notificationSettings: {}
    ,   reference: {}
    ,   refreshedChapterList: []
    ,   startTrans: 0
    ,   startX: 0
    ,   startY: 0
    ,   subscriptionList: []
    ,   user: {}
    }
,   dbs: {}
};

front.handler.reader.toggleChapter = (shortName) => {
    const cse = front.vars.createdStoryElem[shortName];
    let unreadStories,
        ChapterElem = front.methods.getCurrentVisibleChapter(),
        ref,
        firstEl;

    if (front.vars.loadingState[shortName].state === 0) {
        if (front.vars.loadingState.message && front.vars.loadingState.message.f) {
            front.vars.loadingState.message.f.resetTimer();
        } else {
            front.vars.loadingState.message = new front.proto.message({
                closeTimer: 2000,
                messageText: 'Still loading first chapter, please wait.'
            });
        }
        front.methods.changeLoadingPriority(shortName);
        return;
    }


    if (cse.content.classList.contains('hidden')) {
        if (front.methods.checkAllChaptersRead(shortName)) {
            return;
        }
        Array.from(front.el.readerList.children).forEach((el) => {
            if (el.id !== shortName) {
                el.classList.add('hidden');
            }
        });
        if (!Array.from(cse.content.childNodes).filter(el => (el && !el.classList.contains('hiddenChapter') && !el.classList.contains('hidden'))).length) {
            firstEl = cse.content.childNodes[0];
            while (firstEl !== null && firstEl.classList.contains('hidden')) {
                firstEl = firstEl.nextElementSibling;
            }
            if (firstEl !== null) {
                firstEl.classList.remove('hiddenChapter');
            }
        }
        cse.content.classList.remove('hidden');
        front.vars.currentStory = shortName;
        front.el.body.classList.add('readerMode');
        front.el.body.classList.remove('menuMode');
        front.el.refreshButton.classList.add('hidden');
        front.el.markReadButton.classList.remove('hidden');
    } else {
        front.methods.menuMode(shortName);
        ref = (ChapterElem && ChapterElem.id) ? front.vars.reference[ChapterElem.id] : undefined;
        front.methods.hideItem(ref);
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
                if (front.el.body.classList.contains('readerMode')) {
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
    let item,
        firstEl;

    if (elem !== null) {
        item = front.vars.reference[elem.id];
        if (!item.read) {
            front.methods.markRead(item);
        }
        front.methods.hideItem(item);
        if (front.methods.checkAllChaptersRead(item.short)) {
            if (front.vars.refresh) {
                front.methods.refreshedChapterList();
            }

            front.methods.menuMode(front.vars.currentStory);
        } else {
            firstEl = elem.nextElementSibling;
            while (firstEl !== null && firstEl.classList.contains('hidden')) {
                firstEl = firstEl.nextElementSibling;
            }
            if (firstEl === null) {
                firstEl = elem.previousElementSibling;
                while (firstEl !== null && firstEl.classList.contains('hidden')) {
                    firstEl = firstEl.previousElementSibling;
                }
            }
            if (firstEl !== null) {
                firstEl.classList.remove('hiddenChapter');
            } else {
                front.methods.menuMode(front.vars.currentStory);
            }
        }
    } else {
        front.methods.menuMode(front.vars.currentStory);
    }
};

front.handler.content.scroll = (event) => {
    var item = front.vars.reference[event.currentTarget.id];
    if (event.currentTarget.scrollTop  + event.currentTarget.offsetHeight + 100 > event.currentTarget.scrollHeight && !item.read){
        front.methods.markRead(item);
    }
};

front.handler.content.slide = (dir) => {
    const cseList     = front.vars.createdStoryElem[front.vars.currentStory].content,
          ChapterElem = front.methods.getCurrentVisibleChapter();
    let ref,
        targetElem;

    if (ChapterElem !== null) {
        ref = front.vars.reference[ChapterElem.id];
        targetElem = (dir === 'l') ? ChapterElem.previousElementSibling : ChapterElem.nextElementSibling;
        while (targetElem !== null && targetElem.classList.contains('hidden')) {
            targetElem = (dir === 'l') ? targetElem.previousElementSibling : targetElem.nextElementSibling;
        }

        if (targetElem !== null){
            front.methods.hideItem(ref);
            ChapterElem.classList.add('hiddenChapter');
            targetElem.classList.remove('hiddenChapter');
        }
    } else {
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

    if (deltaX > front.el.body.offsetWidth * 0.25){
        front.handler.content.slide('r');
    } else if (deltaX < front.el.body.offsetWidth * -0.25){
        front.handler.content.slide('l');
    }
};

front.handler.menu.fullReload = () => {
    location.reload();
};

front.handler.menu.gotoAdmin = (event) => {
    window.location.href = "/admin";
};

front.handler.menu.loadStory = (event) => {

    if (!front.vars.fullChapterList.length) {
        let busy = new front.proto.busyLayer({
            target: event.currentTarget.parentElement,
            message: 'Loading'
        });
        busy.init();
        front.setupLoadChapterSliders(front.serverActions.getFullChapterList(), busy);
    }

    front.handler.menu.toggleMinimized(event);
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

    if (item.classList.contains('fa-check')) {
        item.classList.remove('fa-check');
        item.classList.add('fa-times');
        front.vars.markRead = "chapter";
        front.vars.markReadStorySelector.target.classList.remove('hideSoft');
    } else {
        item.classList.add('fa-check');
        item.classList.remove('fa-times');
        front.vars.markRead = "all";
        front.vars.markReadStorySelector.target.classList.add('hideSoft');
    }
};

front.handler.menu.resetStorage = (event) => {
    front.methods.confirm(event.currentTarget, () => {
        front.methods.resetStorage();
        front.methods.resetCache();
    }, 'resetStorage');
};

front.handler.menu.show = (event) => {
    front.el.menu.classList.toggle('show');
};

front.handler.menu.toggleMinimizedSound = (event) => {
    let eventClone = {
            currentTarget: {
                parentElement: event.currentTarget.parentElement
            }
        },
        busy;

    if (front.vars.notificationSettings.silent === undefined || front.vars.notificationSettings.vibrate === undefined) {
        busy = new front.proto.busyLayer({
            target: eventClone.currentTarget.parentElement,
            message: 'Loading'
        });

        busy.init();

        front.serverActions.getNotificationSettings()
            .then((res) => {
                front.vars.notificationSettings = JSON.parse(res);
                if (front.vars.notificationSettings.silent) {
                    front.el.toggleSound.classList.remove('fa-check');
                    front.el.toggleSound.classList.add('fa-times');
                }
                if (!front.vars.notificationSettings.vibrate) {
                    front.el.toggleVibrate.classList.remove('fa-check');
                    front.el.toggleVibrate.classList.add('fa-times');
                }
                busy.remove();
            })
            .catch(() => {
                front.handler.menu.toggleMinimized(eventClone);
                busy.remove();
            });
    }

    front.handler.menu.toggleMinimized(eventClone);
};

front.handler.menu.toggleMinimizedSubscriptions = (event) => {
    if (!front.vars.subscriptionList.length) {
        let busy = new front.proto.busyLayer({
            target: event.currentTarget.parentElement,
            message: 'Loading'
        });
        busy.init();
        front.createSubscriptionList(front.serverActions.getSubscriptionList(), busy);
    }

    front.handler.menu.toggleMinimized(event);
};

front.handler.menu.toggleMinimized = (event) => {
    const elem = event.currentTarget.parentElement;
    elem.classList.toggle('minimized');
    elem.classList.toggle('expanded');
};

front.handler.menu.toggleSound = (event) => {
    let item = event.currentTarget,
        busy = new front.proto.busyLayer({
            target: front.el.sound,
            message: 'Loading'
        });

    busy.init();
    if (item.classList.contains('fa-check')) {
        item.classList.remove('fa-check');
        item.classList.add('fa-times');
        front.vars.notificationSettings.silent = 1;
    } else {
        item.classList.add('fa-check');
        item.classList.remove('fa-times');
        front.vars.notificationSettings.silent = 0;
    }
    front.serverActions.setNotificationSettings()
    .then(busy.remove);
};

front.handler.menu.toggleVibrate = (event) => {
    let item = event.currentTarget,
        busy = new front.proto.busyLayer({
            target: front.el.sound,
            message: 'Loading'
        });

    busy.init();

    if (item.classList.contains('fa-check')) {
        item.classList.remove('fa-check');
        item.classList.add('fa-times');
        front.vars.notificationSettings.vibrate = 0;
    } else {
        item.classList.add('fa-check');
        item.classList.remove('fa-times');
        front.vars.notificationSettings.vibrate = 1;
    }
    front.serverActions.setNotificationSettings()
    .then(busy.remove);
};

front.handler.menu.toggleSubscription = (event) => {
    const target = event.target;

    if (target.id) {
        let toggleButton = document.querySelector('.' + target.id + '.toggleButton');
        if (toggleButton) {
            front.serverActions.subscribe(target.id, toggleButton.classList.contains('fa-check'));
            toggleButton.classList.toggle('fa-times');
            toggleButton.classList.toggle('fa-check');
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
    let message = event.data;

    switch(message.type) {
        case 'versionNumber':
            break;
        case 'newChapter':
            front.methods.getChapterList();
            break;
    }
};

front.handler.reload = (event) => {
    event.target.classList.add('fa-spin');
    front.methods.getChapterList()
        .then(() => {
            event.target.classList.remove('fa-spin');
        }).catch(err => console.warn('reload error', err));
};

front.handler.undoMarkRead = (id) => {
    var item = front.vars.reference[id],
        cse = front.vars.createdStoryElem[item.short],
        currentElem = front.methods.getCurrentVisibleChapter();

    if (front.el.body.classList.contains('readerMode') && front.vars.currentStory !== item.short) {
        front.handler.reader.toggleChapter(front.vars.currentStory);
    }

    if (front.el.menu.classList.contains('show')) {
        front.el.menu.classList.remove('show');
    }

    if (currentElem !== null){
        currentElem.classList.add('hiddenChapter');
    }

    item.elem.classList.remove('hidden');
    item.elem.classList.remove('hiddenChapter');
    item.hidden = false;
    cse.counter.count++;
    cse.counter.counter.innerHTML = cse.counter.count;
    front.methods.unmarkRead(item);
    front.methods.checkAllChaptersRead(item.short);

    if (cse.content.classList.contains("hidden")) {
        front.handler.reader.toggleChapter(item.short);
    }
};



front.methods.applyDeleteStash = () => {
    const ref = front.vars.reference,
          idList = front.vars.deleteStash;

    idList.forEach(id => {
        if (ref && ref[id] && ref[id].elem) {
            ref[id].elem.remove();
            delete ref[id];
        }
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
        front.el.body.classList.remove('readerMode');
        front.el.body.classList.add('menuMode');
        front.vars.jwt = jwt;
        navigator.serviceWorker.ready.then((registration) => {
            registration.active.postMessage({type: 'newJWT', jwt: jwt});
        })
        .catch(err => console.warn('checkForToken error', err));
        front.initAfterLogin();
        document.getElementById('loginFrame').classList.add('hidden');
        document.getElementById('loginForm').classList.add('hidden');
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

front.methods.changeLoadingPriority = (short) => {
    front.vars.newLoadingList = front.vars.currentLoadingList.sort((a, b) => {
        if (a.short === short && b.short === short) {
            return parseInt(a.Chapter.toString().replace('.', '0000')) - parseInt(b.Chapter.toString().replace('.', '0000'));
        }
        if (a.short === short) return -1;
        if (b.short === short) return 1;
        return 0;
    });
    front.vars.loadingPriorityChanged = true;
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
                resolve(http.response);
                break;
            case 279:
                resolve(http.response);
                break;
            case 401:
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
    let myArr = arr,
        cse = front.vars.createdStoryElem;

    return new Promise((resolve, reject) => {
        if (arr.length > 0) {
            let currentStory,
                recursiveLoadingFunction = (index) => {
                    let item = myArr[index];

                    front.vars.currentLoadingList = arr.slice(index - 1);

                    if (currentStory !== item.short) {
                        if (!cse[item.short]) {
                            front.methods.initChapterContainer(item.short);
                        }
                        cse[item.short].icon.className = "loadingIcon fa fa-cog fa-spin";
                        if (cse[currentStory]) {
                            cse[currentStory].icon.className = 'loadingIcon fa fa-check complete';
                        }
                        currentStory = item.short;
                    }


                    if (front.vars.loadingPriorityChanged && front.vars.currentLoadingList.length) {
                        front.vars.loadingPriorityChanged = false;
                        front.vars.currentLoadingList.reduce((acc, chap) => {
                            if (!acc.includes(chap.short)) {
                                acc.push(chap.short);
                            }
                            return acc;
                        }, []).forEach(short => cse[short].icon.classList.add('hidden'));
                        myArr = front.vars.newLoadingList;
                        index = 0;

                        front.vars.newLoadingList.reduce((acc, chap) => {
                            if (!acc.includes(chap.short)) {
                                acc.push(chap.short);
                            }
                            return acc;
                        }, []).forEach(short => cse[short].icon.className = 'loadingIcon fa fa-hourglass-1');
                        cse[front.vars.newLoadingList[0].short].icon.className = 'loadingIcon fa fa-cog fa-spin';
                    }

                    if (typeof(item.short) !== 'undefined' && typeof(item.Chapter) !== 'undefined') {
                        if (front.vars.reference[item.short + item.Chapter] === undefined) {
                        front.serverActions.requestChapter(item, addToNew)
                            .then((response) => {
                                item.Content = response;
                                front.chapters.push(item);
                                item.read = false;
                                front.methods.renderChapter(item);
                            })
                            .catch(console.warn)
                            .then(() => {
                                index++;
                                front.vars.loadingState[item.short].state++;
                                if (index < myArr.length) {
                                    recursiveLoadingFunction(index);
                                } else {
                                    cse[item.short].icon.className = 'loadingIcon fa fa-check complete';
                                    resolve();
                                }
                            }).catch(err => console.warn('getChapter error', err));
                        } else {
                            front.methods.renderChapter(item);
                            index++;
                            front.vars.loadingState[item.short].state++;
                            if (index < myArr.length) {
                                recursiveLoadingFunction(index);
                            } else {
                                cse[item.short].icon.className = 'loadingIcon fa fa-check complete';

                                resolve();
                            }
                        }
                    } else {
                    }
                };

            recursiveLoadingFunction(0);
        } else {
            resolve();
        }

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
        return _arr1[0].elem;
    } else {
        return false;
    }
};

front.methods.getCurrentVisibleChapter = () => {
    var currentElem = document.elementFromPoint(front.el.body.offsetWidth / 2, front.el.body.offsetHeight / 2);

    while (currentElem !== null && !currentElem.classList.contains('chapter')) {
        currentElem = currentElem.parentElement;
    }

    return currentElem;
};

front.methods.hideItem = (item) => {
    if (item !== undefined && item.read && !item.hidden) {
        let cse = front.vars.createdStoryElem[item.short];

        cse.counter.count--;
        cse.counter.counter.innerHTML = cse.counter.count;
        item.elem.classList.add('hidden');
        item.hidden = true;
        front.methods.generateMarkReadMessage(item.short+item.Chapter);
        front.methods.checkAllChaptersRead(item.short);
        return true;
    }
    return false;
};

front.methods.initChapterContainer = (short) => {
    const cse = front.vars.createdStoryElem;
    let tempselector;

    if (cse[short] === undefined) {
        cse[short] = {menu: document.createElement('li')};
        cse[short].content = document.createElement('ul');
        cse[short].menu.innerHTML = '<p class="head" title="' + front.vars.shortNameMap[short] + '">' + short + '<span class="counterFrame"><span class="counterIcon fa fa-files-o"></span><span class="iconCounter">0</span></span><span class="loadingIcon hidden"></span></p>';
        tempselector = Array.from(cse[short].menu.querySelectorAll('.loadingIcon, counterFrame, .counterIcon, .iconCounter'));
        cse[short].icon = tempselector.filter(e => e.classList.contains('loadingIcon'))[0];
        cse[short].counter = {
            frame: tempselector.filter(e => e.classList.contains('counterFrame'))[0],
            icon: tempselector.filter(e => e.classList.contains('counterIcon'))[0],
            counter: tempselector.filter(e => e.classList.contains('iconCounter'))[0],
            count: 0
        };
        cse[short].menu.id = short;
        cse[short].content.className = 'sublist hidden';
        front.el.readerList.appendChild(cse[short].menu);
        cse[short].menu.appendChild(cse[short].content);
        cse[short].menu.children[0].addEventListener('click', front.handler.reader.toggleChapter.bind(null, short), false);
        cse[short].content.addEventListener('touchend', front.handler.content.touchend, false);
        cse[short].content.addEventListener('touchstart', front.handler.content.touchstart, false);
        cse[short].chapters = [];
    }
};

front.methods.loadChapterList = (story, start, end) => {
    var arr1,
        arr2 = [];
    const fcl = front.vars.fullChapterList;

    front.vars.loadingState[story] = {state: 0};
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
            document.getElementById('loginForm').classList.add('hidden');
            front.el.reader.classList.remove('hideSoft');
            front.el.menu.classList.remove('hideSoft');
        front.el.body.classList.remove('readerMode');
        front.el.body.classList.add('menuMode');
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
        if (front.vars.loggedin) {
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
        document.getElementById('loginForm').classList.remove('hidden');
        front.el.reader.classList.add('hideSoft');
        front.el.menu.classList.add('hideSoft');
        front.el.adminButton.classList.add('hidden');
        front.el.reader.firstElementChild.innerHTML="";
        front.chapters = [];
        front.vars.createdStoryElem = [];
        front.vars.currentStory = '';
        front.vars.newChapterList = undefined;
        front.vars.refreshedChapterList = [];
        front.vars.reference = [];
        front.vars.user = '';
        front.vars.loggedin = false;
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
    front.vars.refreshedChapterList = front.vars.refreshedChapterList.filter(refitem => (refitem.short !== item.short && refitem.Chapter !== item.Chapter));

    item.read = true;
    front.serverActions.markRead(item)
        .catch(()=>{
            setTimeout(() => {front.methods.markRead(item);}, 30000);
        });
};

front.methods.menuMode = (shortName) => {
    if (shortName) {
        const cse = front.vars.createdStoryElem[shortName];

        front.methods.checkAllChaptersRead(shortName);
        cse.content.classList.add('hidden');
    }

    front.vars.currentStory = '';
    front.el.body.classList.remove('readerMode');
    front.el.body.classList.add('menuMode');
    front.el.refreshButton.classList.remove('hidden');
    front.el.markReadButton.classList.add('hidden');

    unreadStories = front.methods.checkStoriesRead();
    unreadStories.forEach((el) => el.classList.remove('hidden'));

    if (front.vars.freshList) {
        front.methods.refreshedChapterList();
        front.vars.freshList = false;
    }
};

front.methods.newChapterList = () => {
    let loadingObject,
        cse = front.vars.createdStoryElem;

    if (front.vars.newChapterList.length > 0) {
        front.el.message.innerText = "";
        front.vars.newChapterList
            .reduce((acc, chapter) => {
                if (!acc.includes(chapter.short)) {
                    acc.push(chapter.short);
                }
                return acc;
            }, [])
            .sort()
            .forEach(front.methods.initChapterContainer);
        front.vars.newChapterList = front.methods.sortChapters(front.vars.newChapterList);

        front.methods.sortChaptersForLoading(front.vars.newChapterList)
        .then((result) => {
            loadingObject = result;
            loadingObject.firstChapters.forEach(item => front.vars.loadingState[item.short] = {state: 0});
            return front.methods.getChapter(loadingObject.storedChapters);
        }).then(() => {
            loadingObject.firstChapters.forEach((item, index) => {
                if (!index) {
                    cse[item.short].icon.className = 'loadingIcon fa fa-cog fa-spin';
                } else {
                    cse[item.short].icon.className = 'loadingIcon fa fa-hourglass-1';
                }
            });
            return front.methods.getChapter(loadingObject.firstChapters);
        })
        .then(() => {
            loadingObject.otherChapters.reduce((acc, chap) => {
                if (!acc.includes(chap.short)) {
                    acc.push(chap.short);
                }
                return acc;
            }, []).forEach((key, index) => {
                if (!index) {
                    cse[key].icon.className = 'loadingIcon fa fa-cog fa-spin';
                } else {
                    cse[key].icon.className = 'loadingIcon fa fa-hourglass-2';
                }
            });
            return front.methods.getChapter(loadingObject.otherChapters);
        })
        .catch(err => console.warn('newChapterList error', err));
    } else {
        front.el.message.innerText = "All Read!";
    }
};

front.methods.refreshedChapterList = () => {
    let cse = front.vars.createdStoryElem,
        story,
        loadingObject,
        filteredList;

    if (front.el.body.classList.contains('menuMode')) {
        for (story in cse){
            cse[story].counter.count = 0;
            cse[story].menu.classList.add('hidden', 'allRead');
            cse[story].chapters.forEach((chapter) => {
                chapter.elem.classList.add('hidden');
                chapter.hidden = true;
            });
        }

        if (front.vars.refreshedChapterList.length > 0) {
            front.el.message.innerText = "";

            filteredList = front.vars.refreshedChapterList.filter(item => !(front.vars.reference[item.short + item.Chapter] && front.vars.reference[item.short + item.Chapter].read));

            filteredList.reduce((acc, chapter) => {
                    if (!acc.includes(chapter.short)) {
                        acc.push(chapter.short);
                    }
                    return acc;
                }, [])
                .sort()
                .forEach(front.methods.initChapterContainer);

            filteredList = front.methods.sortChapters(filteredList);

            front.methods.sortChaptersForLoading(filteredList)
            .then((result) => {
                loadingObject = result;
                loadingObject.firstChapters.forEach(item => front.vars.loadingState[item.short] = {state: 0});
                return front.methods.getChapter(loadingObject.storedChapters);
            })
            .then(() => {
                loadingObject.firstChapters.forEach((item, index) => {
                    if (!index) {
                        cse[item.short].icon.className = 'loadingIcon fa fa-cog fa-spin';
                    } else {
                        cse[item.short].icon.className = 'loadingIcon fa fa-hourglass-1';
                    }
                });
                return front.methods.getChapter(loadingObject.firstChapters);
            })
            .then(() => {
                loadingObject.otherChapters.reduce((acc, chap) => {
                    if (!acc.includes(chap.short)) {
                        acc.push(chap.short);
                    }
                    return acc;
                }, []).forEach((key, index) => {
                    if (!index) {
                        cse[key].icon.className = 'loadingIcon fa fa-cog fa-spin';
                    } else {
                        cse[key].icon.className = 'loadingIcon fa fa-hourglass-2';
                    }
                });
                return front.methods.getChapter(loadingObject.otherChapters);
            })
            .catch(err => console.warn('newChapterList error', err));
        } else {
            front.el.message.innerText = "All Read!";
        }
    } else {
        front.vars.freshList = true;
    }
};

front.methods.renderChapter = (item) => {
    const cse = front.vars.createdStoryElem,
          ref = front.vars.reference[item.short+item.Chapter];

    let closestChapterElem;

    if (cse[item.short] === undefined) {
        front.methods.initChapterContainer(short);
    }

    if ( ref === undefined || ref.elem === undefined) {
        cse[item.short].counter.count++;
        cse[item.short].counter.counter.innerHTML = cse[item.short].counter.count;
        item.elem = document.createElement('li');
        item.elem.id = item.short + item.Chapter;
        item.elem.className = 'chapter hiddenChapter';
        item.elem.innerHTML = item.Content;
        item.hidden = false;
        front.vars.reference[item.short + item.Chapter] = item;
        closestChapterElem = front.methods.getClosestChapter(item);
        if (closestChapterElem) {
            cse[item.short].content.insertBefore(item.elem, closestChapterElem);
        } else {
            cse[item.short].content.appendChild(item.elem);
        }
        cse[item.short].chapters.push(item);
        item.elem.addEventListener('scroll', front.handler.content.scroll, false);
        front.methods.checkAllChaptersRead(item.short);

    } else {
        if (ref.hidden) {
            cse[item.short].counter.count++;
            cse[item.short].counter.counter.innerHTML = cse[item.short].counter.count;
        }
        ref.read = false;
        ref.hidden = false;
        if (ref.elem.parentElement === null) {
            closestChapterElem = front.methods.getClosestChapter(item);
            if (closestChapterElem) {
                cse[item.short].content.insertBefore(ref.elem, closestChapterElem);
            } else {
                cse[item.short].content.appendChild(ref.elem);
            }
        }
        cse[item.short].menu.classList.remove('allRead', (front.el.reader.classList.contains('readerMode')) ? 'nonExistingClass' : 'hidden');
        ref.elem.classList.remove('hidden');
        front.methods.checkAllChaptersRead(item.short);
    }

    if (front.el.reader.classList.contains('readerMode')){
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

front.methods.sendMessageToSw = (message) => {
  return new Promise((resolve, reject) => {
    let messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
            reject(event.data.error);
        } else {
            resolve(event.data);
        }
    };

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    } else {
        navigator.serviceWorker.ready.then((registration) => {
            registration.active.postMessage(message, [messageChannel.port2]);
        });
    }
  });
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

front.methods.sortChaptersForLoading = (arr) => {
    let sortedarr = front.methods.sortChapters(arr),
        firstChapters = {},
        stories = sortedarr.reduce((acc, chap) => {
            if (!acc.includes(chap.short)) {
                acc.push(chap.short);
            }
            return acc;
        }, []),
        storedChaptersList;

    return Promise.all(stories.map(story => {
            if (!front.dbs[story]) {
                front.dbs[story] = front.tools.initDb(story, 'Chapters')
            }

            return front.dbs[story];
    }))
    .then(dbs => Promise.all(dbs.map(db => db.getIndex())))
    .then(result => {
        return result.reduce((acc, chapters, index) => {
            acc[stories[index]] = chapters;
            return acc;
        }, {});
    })
    .catch((err) => {
        console.log(err);
        return {};
    })
    .then(storedChapters => {
        return sortedarr.reduce((acc, chap) => {
            if (storedChapters[chap.short] && storedChapters[chap.short].includes(chap.Chapter)) {
                if (firstChapters[chap.short] === undefined) {
                    firstChapters[chap.short] = true;
                    acc.firstChapters.push(chap);
                    acc.storedChapters.push(chap);
                } else {
                    acc.storedChapters.push(chap);
                }

            } else if (firstChapters[chap.short] === undefined) {
                firstChapters[chap.short] = true;
                acc.firstChapters.push(chap);
            } else {
                acc.otherChapters.push(chap);
            }
            return acc;
        }, {
            firstChapters: [],
            storedChapters: [],
            otherChapters: []
        });

    });
};

front.methods.unmarkRead = (item) => {
    if (item.read){
        item.read = false;
        front.serverActions.markRead(item)
            .catch(()=>{
                item.read = true;
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
        self.e.messageBody.className = 'message messageBody flexCol';
        self.e.closeButton.className = 'message closeButton fa fa-times';
        self.e.message.innerHTML = self.options.messageText;
        self.options.target.appendChild(self.e.messageBody);
        self.e.messageBody.appendChild(self.e.message);
        self.e.messageBody.appendChild(self.e.closeButton);
        self.e.closeButton.addEventListener('click', self.f.destroy);
        self.body.classList.add('messageActive');

    };

    self.f.setOptions = () => {
        self.options.messageText = options.messageText || 'No Text provided!';
        self.options.closeTimer = options.closeTimer || 0;
        self.options.target = options.target || document.querySelector('body');
        self.body = document.querySelector('body');
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
        self.body.classList.remove('messageActive');
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
        if (self.list.children[0]) {
            self.list.children[0].style.marginTop = '0px';
        }
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
          connectionElem = document.querySelector('.connection');

    let response;

    return new Promise((resolve, reject) => {
        http.open('GET', front.options.server + '/api/getNewChapterList', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            switch(http.readyState){
                case 4:
                    let now = new Date(),
                        timestamp = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

                    timestamp = timestamp.replace(/([:]?\D)(\d)\b/g, '$10$2');
                    connectionElem.innerHTML = 'Last Update: ' +  timestamp;

                    if (http.status === 200) {
                        if (front.vars.newChapterList === undefined) {
                            response = JSON.parse(http.response);
                            front.vars.newChapterList = response.chapterList;
                            front.vars.shortNameMap = response.chapterNameMap;
                            front.vars.chapterListVersion = (front.vars.newChapterList && front.vars.newChapterList.length > 0) ? front.vars.newChapterList[0].new : 0;

                            front.methods.newChapterList();
                        } else {
                            front.vars.refreshedChapterList = JSON.parse(http.response).chapterList;

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
                        resolve();
                    } else {
                        if (http.status === 401) {
                            front.methods.logout();
                            reject();
                        }
                        resolve();
                    }
            }
        };
        http.onerror = () => {
            resolve();
        };
        http.send();
    });
};

front.serverActions.getFullChapterList = () => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        http.open('GET', front.options.server + '/api/requestFullChapterList', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            switch(http.readyState){
                case 2:
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
                        resolve();
                    } else {
                        if (http.status === 401) {
                            front.methods.logout();
                        }
                        reject();
                    }
            }
        };
        http.send();
    });
};

front.serverActions.getNewToken = () => {
    const   http = new XMLHttpRequest(),
            url = front.options.server + '/refreshToken';

    return new Promise((resolve, reject) => {
        http.open('GET', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            if (http.readyState === 4) {
                switch(http.status) {
                    case 200:
                    case 279:
                        let res = JSON.parse(http.response);
                        front.vars.user = JSON.parse(atob(res.token.split('.')[1]));
                        front.vars.jwt =  res.token;
                        localStorage.jwt = res.token;

                        navigator.serviceWorker.ready.then((registration) => {
                            if (navigator.serviceWorker.controller) {
                                clearInterval(front.vars.reloadTimer);
                                navigator.serviceWorker.controller.postMessage({type: 'newJWT', jwt: res.token});
                            }
                        });
                        resolve();
                        break;
                    case 401:
                        front.methods.logout();
                        reject();
                        break;
                    default:
                        reject();
                        break;
                }
            }
        };
        http.send();
    });
};

front.serverActions.getNotificationSettings = () => {
    const   http = new XMLHttpRequest(),
            url = front.options.server + '/api/notificationSettings';

    return new Promise((resolve, reject) => {
        http.open('GET', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send();
    });
};

front.serverActions.getStatus = () => {
    const http = new XMLHttpRequest(),
        url = front.options.server + '/api/status';

        return new Promise((resolve, reject) => {
            http.open('GET', url, true);
            http.setRequestHeader("Cache-Control", "no-Cache");
            http.setRequestHeader("jwt", front.vars.jwt);
            http.onreadystatechange = (event) => {
                if (http.readyState === 4) {
                    if (http.status === 200){
                        front.vars.serverStatus = JSON.parse(http.response);
                        resolve();
                    } else {
                        reject(http.status);
                    }
                }
            };
            http.send();
        });
};

front.serverActions.getSubscriptionList = () => {
    const http = new XMLHttpRequest(),
        url = front.options.server + '/api/subscribeSeries';

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
        url = front.options.server + '/login',
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
          url = front.options.server + '/api/markAllRead' + data;

    return new Promise((resolve, reject) => {
        http.open('PUT', url, true);
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
            front.handler.reload();
        };
        http.send();
    });
};

front.serverActions.markRead = (item) => {
    const http = new XMLHttpRequest(),
          url = front.options.server + '/api/markRead?short=' + item.short + '&chapter=' + item.Chapter + '&read=' + item.read;

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
          url = front.options.server + '/api/markNew?short=' + item.short + '&chapter=' + item.Chapter + '&read=' + item.read;

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
          url = front.options.server + '/api/messageKey',
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
            url = front.options.server + '/api/requestChapter' + '?short=' + item.short + '&chapter=' + item.Chapter + '&addToNew=' + (addToNew ? addToNew : false);

    if (!front.dbs[item.short]) {
        front.dbs[item.short] = front.tools.initDb(item.short, 'Chapters')
    }

    return new Promise((resolve, reject) => {
        front.dbs[item.short]
        .then(db => db.get(item.Chapter))
        .then((dbItem) => {
            if (dbItem !== undefined && dbItem.length >= 1000) {
                if (addToNew) {
                    front.serverActions.markNew(item)
                        .catch(err => console.log(err));
                }

                resolve(dbItem);
            } else {
                http.open('GET', url, true);
                http.setRequestHeader("jwt", front.vars.jwt);
                http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                http.addEventListener("progress", (event) => {
                });
                http.onreadystatechange = (event, res) => {
                    if (http.readyState === 4 && http.status === 200) {
                        front.dbs[item.short]
                        .then(db => db.set(item.Chapter, http.responseText))
                        .catch(console.log)
                        .then(() => {
                            resolve(http.responseText);
                        });

                    } else if (http.readyState === 4) {
                        if (http.status === 401) {
                            front.methods.logout();
                        }
                        reject();
                    }
                };
                http.send();
            }
        })
        .catch(console.log);
    });
};

front.serverActions.setNotificationSettings = () => {
    const   http = new XMLHttpRequest(),
            url = front.options.server + '/api/notificationSettings';

    return new Promise((resolve, reject) => {
        http.open('POST', url, true);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.setRequestHeader("jwt", front.vars.jwt);
        http.onreadystatechange = () => {
            front.methods.defaultRequestHandling(http, resolve, reject);
        };
        http.send('silent=' + front.vars.notificationSettings.silent + '&vibrate=' + front.vars.notificationSettings.vibrate);
    });
};

front.serverActions.subscribe = (short, unsubscribe) => {
    const http = new XMLHttpRequest(),
        url = front.options.server + '/api/subscribeSeries',
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



front.tools.initDb = (DBName, storageName, version) => {
    let request = indexedDB.open(DBName),
        db;

    return new Promise((resolve, reject) => {
        request.onupgradeneeded = function() {
            var db = this.result;
            if (!db.objectStoreNames.contains(storageName)) {
                db.createObjectStore(storageName, {
                    keyPath: 'key'
                });
            }
        };

        request.onerror = reject;

        request.onblocked = reject;

        request.onsuccess = function() {
            db = this.result;

            db.onversionchange = () => {
                console.log(arguments);
            };

            db.onerror = () => {
                console.log(arguments);
            };

            db.onabort = () => {
                console.log(arguments);
            };

            db.delete = (id) => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readwrite').objectStore(storageName),
                        request = store.delete(id);

                    request.onsuccess = evt => resolve(evt);
                    request.onerror = evt => reject(evt);
                });
            };

            db.get = (id) => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readonly').objectStore(storageName),
                        request = store.get(id);

                    request.onsuccess = evt => resolve(evt.target.result ? evt.target.result.data : 'undefined');
                    request.onerror = evt => reject(evt);
                });
            };

            db.getIndex = () => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readonly').objectStore(storageName),
                        request = store.getAllKeys();

                    request.onsuccess = evt => resolve(evt.target.result ? evt.target.result : []);
                    request.onerror = evt => reject(evt);
                });
            };

            db.set = function(id, data) {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readwrite').objectStore(storageName),
                        request = store.put({key: id, data: data});

                    request.onsuccess = evt => resolve(evt);
                    request.onerror = evt => reject(evt);
                });
            };

            resolve(db);
        };
    });
};



front.init = () => {
    front.methods.checkForToken();
    document.querySelector('#loginButton').addEventListener('click', front.handler.login);
};

front.initAfterLogin = () => {
    let chapterDbController,
        chapterArray,
        timestamp = new Date().getTime(),
        chapterList;

    front.registerServiceWorker();

    if (front.vars.setupStatus !== 'initialized') {
        front.vars.setupStatus = 'initialized';

        chapterList = front.serverActions.getChapterList();

        front.setupMarkReadSliders(chapterList);
        front.registerListeners();
        front.initLoadingCircle([chapterList]);

        chapterList.then(() => {
            chapterArray = front.vars.newChapterList.reduce((list, item) => {
                list.push(item.short + item.Chapter);
                return list;
            }, []);

            // clean local storage
            if (localStorage.timestamps) {
                chapterDbController = JSON.parse(localStorage.timestamps);
                chapterDbController = chapterDbController.filter((item) => {
                    if (item.timestamp + 604800000 < timestamp && !chapterArray.includes(item.key)) {
                        localStorage[item.key] = undefined;
                        return false;
                    }
                    return true;
                });
                localStorage.timestamps = JSON.stringify(chapterDbController);
            }
        });
    } else {
        front.methods.getChapterList();
    }

    if (front.vars.user.role === "admin") {
        document.querySelector('#admin').classList.remove('hidden');
        front.el.statusRow.classList.remove('hidden');
        front.serverActions.getStatus().then(front.initStatus);
    }

    front.vars.loggedin = true;
};

front.initLoadingCircle = (arr) => {
    let loadingCircleTimeout = setTimeout(() => {
        front.el.body.insertAdjacentHTML('beforeend', '<div class="loadingCircle"></div><div class="loadingCircleContent">loading</div>');
    }, 1000);

    Promise.all(arr)
        .then(() => {
            let loadingCircle = document.querySelector('.loadingCircle'),
                loadingCircleContent = document.querySelector('.loadingCircleContent');

            clearTimeout(loadingCircleTimeout);
            if (loadingCircle) {
                loadingCircle.remove();
                loadingCircleContent.remove();
            }
        }).catch(err => console.log(err));
};

front.registerListeners = () => {
    const h = front.handler,
          m = h.menu;

    document.querySelector('#markReadButton').addEventListener('click', h.content.markReadButton, false);
    document.querySelector('#loadStory').firstElementChild.addEventListener('click', m.loadStory);
    document.querySelector('#markAllRead').firstElementChild.addEventListener('click', m.toggleMinimized);
    document.querySelector('#manageSubs').firstElementChild.addEventListener('click', m.toggleMinimizedSubscriptions);
    document.querySelector('#status').firstElementChild.addEventListener('click', m.toggleMinimized);
    document.querySelector('#sound').firstElementChild.addEventListener('click', m.toggleMinimizedSound);
    document.querySelector('#toggleSound').addEventListener('click', m.toggleSound);
    document.querySelector('#toggleVibrate').addEventListener('click', m.toggleVibrate);
    document.querySelector('#logoutButton').addEventListener('click', m.logout);
    document.querySelector('#reloadPageButton').addEventListener('click', m.fullReload);
    document.querySelector('#resetStorageButton').addEventListener('click', h.menu.resetStorage);
    document.querySelector('#reload').addEventListener('click', front.handler.reload);
    document.addEventListener('keyup', h.content.keys, false);
    document.addEventListener('keydown', h.content.keys, false);
    document.getElementById('menuHead').addEventListener('click', m.show);
    navigator.serviceWorker.addEventListener('message', h.message);
    document.addEventListener('visibilitychange', front.handler.focus);
    front.el.adminButton.addEventListener('click', front.handler.menu.gotoAdmin);
};

front.initStatus = () => {
    let status = front.el.statusRow,
        usercount = status.querySelector('#usercount'),
        uptime = status.querySelector('#uptime'),
        inactive = status.querySelector('#inactiveList'),
        inactiveTmpl = (short, duration) => `<li>${short} was last updated ${duration}.</li>`;

    usercount.innerHTML = front.vars.serverStatus.usercount;
    uptime.innerHTML = front.vars.serverStatus.uptime;
    inactive.innerHTML = front.vars.serverStatus.slowUpdates.map(story => inactiveTmpl(story.short, story.updated)).join('\n');
};

front.createSubscriptionList = (subscriptionList, busy) => {
    const l = document.getElementById('subsList'),
          lParent = l.parentElement;

    subscriptionList.then(() => {
        l.remove();
        front.vars.subscriptionList.forEach((story) => {
            let listElem = document.createElement('li');
            listElem.innerHTML = '<div class="flexRow" id="' + story.short +
                '"><label for="" id="' + story.short +
                '">' + story.short +
                '</label><div id="' + story.short +
                '" class="' + story.short +
                ' toggleButton fa ' + (story.active ? 'fa-check' : 'fa-times') +
                '"></div></div>';
            l.appendChild(listElem);
        });
        lParent.appendChild(l);
        l.addEventListener('click', front.handler.menu.toggleSubscription);
        busy.remove();
    }).catch(err => console.warn('createSubscriptionList error', err));
};

front.setupMarkReadSliders = (chapterList) => {
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
};

front.setupLoadChapterSliders = (fullChapterList, busy) => {
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
            busy.remove();
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


front.init();
});