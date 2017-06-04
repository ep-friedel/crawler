/*global Response, Blob, clients, self, caches, Request, Headers, console, fetch, navigator, setInterval, clearInterval */

'use strict';
let pastBody = '',
    version = 'v5',
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
        'api/subscribeSeries'
    ],
    offlineFirst = [
        'api/requestChapter'
    ],
    requestStack = [],
    stackTimer,
    flushInProgress;

const relativeUrl   = 'index',
      serverUrl     = 'https://crawler.fochlac.com/',
      apiUrl     = 'https://crawler.fochlac.com/',
      iconUrl       = '/images/bookcase_144.png',
      offlineRegex  = new RegExp(offlineFirst.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')),
      onlineRegex   = new RegExp(onlineFirst.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')),
      staticRegex   = new RegExp(staticContent.map(str => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|'));

function handle_push(event) {
    clients.matchAll().then( clientList => {
        clientList.forEach(triggerRefresh);
    });

    event.waitUntil(new Promise((resolve, reject) => {
        self.registration.getNotifications()
            .then(closeOldMessages)
            .then(() => displayMessage(event.data.text()))
            .then(resolve)
            .catch(reject);
    }));

    if (jwt !== undefined) {
        let opts = JSON.parse(event.data.text()),
            chapterArray = opts.chapterArray,
            url,
            reqArr = [],
            newReq;
        caches.open(version)
        .then(function(cache) {
            chapterArray.forEach(story => {
                story.chapters.forEach((chapter) => {
                    url = apiUrl + 'api/requestChapter?short=' + story.short + '&chapter=' + chapter + '&addToNew=false';
                    newReq = new Request(url, {headers: new Headers({jwt: jwt})});
                    reqArr.push(newReq);
                });
            });

            Promise.all(reqArr.map(req => cache.delete(req)))
                .then(() => cache.addAll(reqArr))
                .catch(err => console.warn(err));

        }).catch(err => console.warn(err));
    }
}

function handle_click(event) {
    self.registration.getNotifications().then(list => list.forEach(notification => notification.close()));
    pastBody = '';

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
        ).catch(err => console.warn(err))
    );
}

function handle_message(event) {
    let message = event.data;

    switch(message.type) {
        case 'resetBase':
            pastBody = '';
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
    }
}

function handle_fetch(event) {
    if (event.request.method === 'GET') {
        if (onlineRegex.test(event.request.url)) {
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
        } else if (offlineRegex.test(event.request.url)) {
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
        } else if (staticRegex.test(event.request.url)) {
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

function displayMessage(data) {
    let opts = JSON.parse(data),
        chapterArray = opts.chapterArray,
        body = pastBody;

    chapterArray.forEach(story => {
        body += story.short + ': ' + story.chapters.join(', ') + '. ';
    });

    if (opts.silent && opts.vibrate) {
        navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
        if (navigator.vibrate) {
            navigator.vibrate([1000]);
        }
    }

    pastBody = body;
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

self.addEventListener('notificationclick', handle_click);
self.addEventListener('message', handle_message);
self.addEventListener('fetch', handle_fetch);
self.addEventListener('push', handle_push);
self.addEventListener('install', (event) => {
    event.waitUntil(cacheStatic());
    self.skipWaiting();
});