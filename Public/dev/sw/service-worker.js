/*global Response, Blob, clients, self, caches, Request, Headers, console, fetch, navigator, setInterval, clearInterval, clearTimeout, setTimeout, indexedDB */

'use strict';
let version = '4',
    jwt,
    offline = new Response(new Blob(), {status: 279}),
    staticContent = [
        'images/bookcase_48.png',
        'images/bookcase_96.png',
        'images/bookcase_192.png',
        'images/bookcase_144.png',
        'images/key.svg',
        'images/library_back.png',
        'images/library_book.png',
        'images/book_16.ico',
        'fonts/FontAwesome.otf?v=4.7.0',
        'fonts/fontawesome-webfont.eot?v=4.7.0',
        'fonts/fontawesome-webfont.svg?v=4.7.0',
        'fonts/fontawesome-webfont.ttf?v=4.7.0',
        'fonts/fontawesome-webfont.woff?v=4.7.0',
        'fonts/fontawesome-webfont.woff2?v=4.7.0',
        'js/admin.js',
        'js/base.js',
        'css/font-awesome.min.css',
        'css/admin.css',
        'css/base.css',
        'index',
        'admin'
    ],
    onlineFirst = [
        'api/getNewChapterList',
        'api/requestFullChapterList',
        'api/subscribeSeries',
        'api/requestChapter'
    ],
    offlineFirst = [
    ],
    requestStack = [],
    stackTimer,
    flushInProgress,
    pushEventStack = [],
    pushTimeout;

const relativeUrl   = 'index',
      serverUrl     = 'https://crawler.fochlac.com/',
      apiUrl     = 'https://crawler.fochlac.com/',
      iconUrl       = '/images/bookcase_144.png',
      offlineRegex  = offlineFirst.length ?  new RegExp(offlineFirst.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')) : undefined,
      onlineRegex   = onlineFirst.length ? new RegExp(onlineFirst.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')) : undefined,
      staticRegex   = staticContent.length ?  new RegExp(staticContent.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')) : undefined;

function handle_push(event) {
    if (pushTimeout) {
        clearTimeout(pushTimeout);
    }

    pushEventStack.push(event);


    clients.matchAll().then( clientList => {
        clientList.forEach(triggerRefresh);
    });

    event.waitUntil(new Promise((resolve, reject) => {
        pushTimeout = setTimeout(() => {
            self.registration.getNotifications()
                .then(closeOldMessages)
                .then(parsePushEventStack)
                .then(saveMessages)
                .then(displayMessage)
                .then(resolve)
                .catch(reject)
                .then(clearPushEventStack);
        }, 3000);
    }));

    if (jwt !== undefined) {
        let opts = JSON.parse(event.data.text()),
            chapterArray = opts.chapterArray,
            url,
            reqArr = [],
            newReq;

        chapterArray.forEach(story => {
            story.chapters.forEach((chapter) => {
                let chapterText;

                url = apiUrl + 'api/requestChapter?short=' + story.short + '&chapter=' + chapter + '&addToNew=false';
                newReq = new Request(url, {headers: new Headers({jwt: jwt})});
                fetch(newReq)
                    .then(req => req.text())
                    .then(text => {
                        chapterText = text;
                        return initDb(story.short, 'Chapters');
                    })
                    .then(db => db.set(chapter, chapterText))
                    .catch(console.error);
            });
        });
    }
}

function parsePushEventStack() {
    return Promise.all(pushEventStack.map(event => event.data.text()));
}

function clearPushEventStack() {
    pushEventStack = [];
}

function handle_click(event) {
    self.registration.getNotifications().then(list => list.forEach(notification => notification.close()));

    event.waitUntil(
        clients.matchAll().then(
            function(clientList) {
                let exists = clientList.some((client) => {
                    if (client.url === serverUrl + relativeUrl && 'focus' in client) {
                        return client.focus();
                    }
                });
                if (!exists && clients.openWindow) {
                    return clients.openWindow(relativeUrl);
                }
            }
        )
        .then(() => initDb('ServiceWorker', 'MessageCache'))
        .then(db => db.delete('Cache'))
        .catch(err => console.warn(err))
    );
}

function handle_message(event) {
    let message = event.data;

    switch(message.type) {
        case 'resetBase':
            initDb('ServiceWorker', 'MessageCache').then(db => db.delete('Cache'));
            break;
        case 'newJWT':
            jwt = message.jwt;
            break;
        case 'deleteJWT':
            jwt = undefined;
            clearCache();
            break;
        case 'clearCache':
            clearCache();
            break;
        default:
            console.log('Error: Unknown Message:' + event.data);
            break;
    }
}

function handle_fetch(event) {
    if (event.request.method === 'GET') {
        if (onlineRegex && onlineRegex.test(event.request.url)) {
            let req = event.request.clone();
            event.respondWith(
                fetch(event.request)
                .then(res => {
                    caches.open(version)
                        .then(cache => {
                            cache.put(req.clone(), res.clone());
                        });
                    return res.clone();
                })
                .catch(() => {
                    return caches.open(version)
                    .then(cache => {
                        return cache.match(req);
                    })
                    .then((res) => {
                        if (res) {
                            return res;
                        } else {
                            return offline.clone();
                        }
                    }).catch(err => console.warn(err));
                })
            );
        } else if (offlineRegex && offlineRegex.test(event.request.url)) {
            event.respondWith(
                caches.open(version)
                .then(cache => {
                    return cache.match(event.request)
                    .then((res) => {
                        if (res) {
                            return res;
                        } else {
                            let req = event.request;

                            fetch(req.clone()).then(res => {
                                caches.open(version)
                                .then(cache => {
                                    cache.put(req.clone(), res.clone());
                                }).catch(err => console.warn(err));
                            }).catch(err => console.warn(err));

                            return fetch(req.clone()).catch(err => console.warn(err));
                        }
                    }).catch(err => console.warn(err));
                }).catch(err => console.warn(err))
            );
        } else if (staticRegex && staticRegex.test(event.request.url)) {
            event.respondWith(
                caches.open(version)
                .then(cache => {
                    return cache.match(event.request.clone());
                })
                .then((res) => {
                    if (res) {
                        return res;
                    } else {
                        cacheStatic();
                        return fetch(event.request).catch(err => console.warn(err));
                    }
                }).catch(err => console.warn(err))
            );
        }
    } else if(!navigator.onLine) {
        event.respondWith(offline.clone());
        requestStack.push(event.request);
        stackTimer = setInterval(flushStack, 30000);
    }
}

function saveMessages(data) {
    let opts = data.reduce((acc, option) => {
            let parsedOption = JSON.parse(option);

            acc.silent = parsedOption.silent;
            acc.chapterArray = acc.chapterArray.concat(parsedOption.chapterArray);

            return acc;
        }, {silent: true, chapterArray: []}),

        dbObj;

    return initDb('ServiceWorker', 'MessageCache')
        .then(db => {
            dbObj = db;

            return db.get('Cache');
        })
        .catch(console.log)
        .then(cache => {
            let unreadMessages = (cache && cache.chapters) ? cache.chapters : {},
                story,
                newChapters;

            opts.chapterArray.forEach((story) => {
                if (unreadMessages[story.short]) {
                    newChapters =  story.chapters.filter(chapter => (unreadMessages[story.short].indexOf(chapter) === -1));
                    if (newChapters.length) {
                        unreadMessages[story.short] = unreadMessages[story.short].concat(newChapters);
                    }
                } else {
                    unreadMessages[story.short] = story.chapters;
                }
            });
            opts = {silent: opts.silent, chapters: unreadMessages};
            return opts;
        })
        .then(opts => {
            return dbObj.set('Cache', opts);
        })
        .catch(console.log)
        .then(() => {
            return opts;
        });
}

function clearCache() {
    caches.keys()
        .then(cacheNames => cacheNames.filter(cache => cache !== version))
        .then(cacheNames => Promise.all(cacheNames.map(cacheName => caches.delete(cacheName))))
        .then(() => caches.open(version))
        .then(cache => {
            cache.keys()
                .then(keys => keys.filter((key) => !staticRegex.test(key.url)).map(key => cache.delete(key)));
        })
        .catch(error => console.warn('deleteAllCaches ', error));
}

function flushStack() {
    if(navigator.onLine && !flushInProgress && requestStack.length > 0) {
        flushInProgress = true;

        new Promise(fetchFirstRequestFromStack)
        .then(() => {
            clearInterval(stackTimer);
        })
        .catch(err => console.warn(err));
    }
}

function fetchFirstRequestFromStack(resolve, reject) {
    fetch(requestStack[0])
        .then((res) => {
            if (res.status === 200 || res.status === 500) {
                requestStack.splice(0, 1);
                if (requestStack.length > 0) {
                    fetchFirstRequestFromStack(resolve, reject);
                } else {
                    resolve();
                }
            }
        })
        .catch(reject);
}

function cacheStatic() {
    return caches.open(version)
        .then(function(cache) {
            return cache.addAll(staticContent.map(url => serverUrl + url));
        }).catch(err => console.warn(err));
}

function closeOldMessages(list) {
    return new Promise((resolve, reject) => {
        if (list && list.length) {
            list.forEach(notification => notification.close());
        }
        resolve();
    });
}

function displayMessage(opts) {
    let body = '',
        story;

    for (story in opts.chapters) {
        body += story + ': ' + opts.chapters[story].join(', ') + '. ';
    }

    return self.registration.showNotification('New Chapters for:', {
            body: body,
            icon: iconUrl,
            silent: opts.silent == "1"
        });
}

function triggerRefresh(client) {
    if (client.url === serverUrl + relativeUrl) {
        client.postMessage('newChapter');
    }
}

function initDb(DBName, storageName, version) {
    let request = version ? indexedDB.open(DBName, version) : indexedDB.open(DBName),
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

        request.onsuccess = function() {
            db = this.result;

            db.delete = (id) => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readwrite').objectStore(storageName),
                        request = store.delete(id);

                    request.onsuccess = evt => resolve(evt);
                    request.onerror = evt => reject(evt);
                });
            };

            db.deleteAll = () => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readwrite').objectStore(storageName),
                        request = store.openCursor();

                    request.onsuccess = evt => {
                        let cursor = evt.target.result;
                        if (cursor) {
                            cursor.delete();
                            cursor.continue();
                        } else {
                            resolve(evt);
                        }
                    };

                    request.onerror = evt => reject(evt);
                });
            };

            db.get = (id) => {
                return new Promise( (resolve, reject) => {
                    var store = db.transaction([storageName], 'readonly').objectStore(storageName),
                        request = store.get(id);

                    request.onsuccess = evt => resolve(evt.target.result ? evt.target.result.data : {});
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

            if (db.objectStoreNames.contains(storageName)) {
                resolve(db);
            } else {
                resolve(initDb(DBName, storageName, db.version + 1));
            }

        };
    });
}

self.addEventListener('notificationclick', handle_click);
self.addEventListener('message', handle_message);
self.addEventListener('fetch', handle_fetch);
self.addEventListener('push', handle_push);
self.addEventListener('install', (event) => {
    event.waitUntil(cacheStatic());
    self.skipWaiting();
});