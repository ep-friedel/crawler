function methods (back) {
    const   cloudscraper= require('cloudscraper')
        ,   request     = require('request')
        ,   exec        = require('child_process').execFile
        ,   fs          = require('fs')
        ,   logger      = require(process.env.CRAWLER_HOME + 'modules/log/logger')(back)
        ,   chapterDB   = require(process.env.CRAWLER_HOME + 'modules/sql/chapterDB')(back)
        ,   userDB      = require(process.env.CRAWLER_HOME + 'modules/sql/userDB')(back)
        ,   message     = require('web-push')
        ,   moment      = require('moment');

    message.setGCMAPIKey('AIzaSyDfk540wtYxDhYL5K0j6kiOpQBqe3dPKT8');
    message.setVapidDetails(
      'mailto:fochlac@gmail.com',
      'BLaOlvhqet3tC5e6oIliQr5NF2Sqn8VHq9VjzR9ItF9AnHFgYaB3dN38rTuYC6tKSRxzzTFmMia6kJ_J2auGLCU',
      'XUrwfTFYENtpbX63Wx9drwlfsB8n3RWnmc-156PeexI'
    );

    const   m = back.methods
        ,   o = back.options
        ,   cDB = chapterDB
        ,   uDB = userDB;

    let crawlSite = [],
        runningCrawls = false,
        error = [],
        crawlerError = 0,
        csrfToken;


    m.addSeries = (param) => {
        let vars = m.escapeArray(['name', 'short', 'rss', 'url1', 'url2', 'chapter', 'book', 'url3', 'bookChapterReset', 'currentLink', 'minChapterLength', 'bookId'], param);

        return Promise
            .all([cDB.createStoryTable(vars), cDB.insertStorySettings(vars)])
            .catch(m.promiseError);
    };

    m.clearAutoRefresh = () => {
        m.log(1, 'clearAutoRefresh');

        if (back.refreshTimer !== undefined) {
            clearInterval(back.refreshTimer);
        }
        back.refreshTimer = undefined;
    };

    m.crawlByLink = (item) => {
        let newChapters = {
                short: item.short,
                chapters: []
            },
            url = item.currentLink,
            count = item.start;

        m.log(5, 'crawlByLink: Site: ' + item.short + ', Url: ', url);

        return new Promise((resolve, reject) => {
            function recursiveCrawlingFunction (item, url, count) {
                let newUrl, content;

                if (typeof(url) !== 'string' || url === 'false') {
                    reject('no url');
                } else {
                    cloudscraper.get(url, (err, res, pageContent) => {
                        if (err !== null) {
                            reject('requesterror: '+ err);
                        }
                        if (pageContent !== undefined && typeof(pageContent) !== 'object') {
                            if (pageContent.includes('body class="error404')){
                                    if (newChapters.chapters.length) {
                                        m.updateChapter(item.short, count, url);
                                    }
                                    m.log(4, 'crawlByLink: Site: ' + item.short + ', Site not found! Url: ', url);
                                    resolve(newChapters);
                            } else {
                                m.log(5, 'crawlByLink: Site: ' + item.short + ', got html ');
                                newUrl = m.getUrl(pageContent);
                                content = m.parseHtml(pageContent);
                                if (content.length > item.minChapterLength && newUrl !== false) {
                                    cDB.inputChapter(count, 'false', item.short, content)
                                        .catch(m.promiseError);
                                    newChapters.chapters.push(count);
                                    m.setAsNewChapter(count, item.short);
                                    m.updateChapter(item.short, count, url);
                                    recursiveCrawlingFunction(item, newUrl, parseInt(count) + 1);
                                } else {
                                    m.log(5, 'crawlByLink: Site: ' + item.short + ', Crawl finished at Chapter ' + count);
                                    if (newChapters.chapters.length) {
                                        m.updateChapter(item.short, count, url);
                                    }
                                    resolve(newChapters);
                                }
                            }
                        } else {
                            reject('ObjectError');
                        }
                    });
                }
            }
            recursiveCrawlingFunction(item, url, count);
        });
    };

    m.crawlSite = (item) => {
        let newChapters = {
                short: item.short,
                chapters: []
            },
            start = item.start,
            start2 = item.start2;

        m.log(5, 'crawlSite: Site: ' + item.short + ', Chapter: ', start);

        return new Promise((resolve, reject) => {
            function recursiveCrawlingFunction (item, start, start2) {
                let url = item.url1 + ((start2 !== 'false') ? (start2 + item.url2 + start + item.url3) : (start + item.url2)),
                    content;
                cloudscraper.get(url, (err, res, pageContent) => {
                    if (err !== null) {
                        reject(err);
                        return;
                    }

                    if (pageContent !== undefined && typeof(pageContent) !== 'object') {
                        if (pageContent.includes('body class="error404')){
                            if (start2 !== 'false' && !error[item.short]) {
                                newstart2 = parseInt(start2) + 1;
                                newstart = (item.bookChapterReset !== 0) ? 1 : start;

                                error[item.short] = true;

                                m.log(5, 'crawlSite: Site: ' + item.short + ', 404 error, trying book ' + newstart2 + ' Chapter ', newstart);
                                if (newChapters.chapters.length) {
                                    m.updateChapter(item.short, start);
                                }
                                recursiveCrawlingFunction(item, newstart, newstart2);
                            } else {
                                if (!error[item.short] && newChapters.chapters.length) {
                                    m.updateChapter(item.short, start);
                                }
                                m.log(4, 'crawlSite, Site: ' + item.short + ', Message: Site not found! Url: ', url);
                                resolve(newChapters);
                            }
                        } else {
                            m.log(5, 'crawlSite: Site: ' + item.short + ', got html ');
                            content = m.parseHtml(pageContent);

                            if (content.length > item.minChapterLength) {
                                cDB.inputChapter(start, start2, item.short, content)
                                    .catch(m.promiseError);
                                m.setAsNewChapter((start2 !== 'false') ? start2 + '.' + start : start , item.short);
                                newChapters.chapters.push((start2 !== 'false') ? start2 + '.' + start : start);
                                m.updateChapter(item.short, start);

                                if (start2 !== 'false' && error[item.short]) {
                                    error[item.short] = false;
                                    cDB.updateStorySettingsWithBooks(start2, item.short)
                                        .catch(m.promiseError);
                                }
                                recursiveCrawlingFunction(item, parseInt(start) + 1, start2);

                            } else {
                                if (start2 !== 'false' && !error[item.short]) {
                                    error[item.short] = true;

                                    m.log(5, 'crawlSite: Site: ' + item.short + ', short text, trying book ', parseInt(start2) + 1);

                                    if (newChapters.chapters.length) {
                                        m.updateChapter(item.short, start);
                                    }
                                    recursiveCrawlingFunction(item, 1, parseInt(start2) + 1);
                                } else {
                                    m.log(5, 'crawlSite: Site: ' + item.short + ', Crawl finished at Chapter ', start);

                                    if (!error[item.short] && newChapters.chapters.length) {
                                        m.updateChapter(item.short, start);
                                    }
                                    resolve(newChapters);
                                }
                            }
                        }
                    } else {
                        reject('Object Error');
                    }
                });
            }
            recursiveCrawlingFunction(item, start, start2);
        });
    };

    m.crawlQuidan = (item) => {
        let newChapters = {
                short: item.short,
                chapters: []
            },
            bookId = item.bookId;
        return m.getQuidanToken()
        .then(() => {
            return new Promise((resolve, reject) => {
                cloudscraper.get(`https://www.webnovel.com/apiajax/chapter/GetChapterList?_csrfToken=${csrfToken}&bookId=${bookId}`, (err, res, content) => {
                    if (err) {
                        reject(err);
                        return err;
                    }
                    m.log(5, 'crawlByLink: Site: ' + item.short + ', got ChapterList');

                    let response = JSON.parse(content),
                        data = response ? response.data : undefined,
                        chapterNumber = data ? data.bookInfo.totalChapterNum : undefined,
                        chapterList;
                    if (response.code !== 0) {
                        m.log(2, 'crawlByLink: Site: ' + item.short + ', Error requesting ChapterList: ', content);
                        csrfToken = undefined;
                        reject(content);

                    } else if (chapterNumber && item.start < chapterNumber) {
                        chapterList = data.chapterItems.slice(item.start);
                        if (!chapterList.filter(item => (item.chapterIndex > item.start)).length) {
                            chapterList = data.chapterItems.filter(item => (item.chapterIndex > item.start));

                            if (!chapterList.length) {
                                m.log(2, 'crawlByLink: Site: ' + item.short + ', index updated, but chapter not yet available', data.chapterItems.filter(item => (item.chapterIndex > item.start - 10)));
                                resolve(newChapters);
                                return;
                            }
                        }

                        function recursiveCrawlingFunction (item, count) {
                            let content;

                            cloudscraper.get(`https://www.webnovel.com/apiajax/chapter/GetContent?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterList[0].chapterId}`, (err, res, chapterresponse) => {
                                if (err !== null) {
                                    reject('requesterror: '+ err);
                                }
                                m.log(5, 'crawlByLink: Site: ' + item.short + ', got response');

                                if (chapterresponse !== undefined && typeof(chapterresponse) !== 'object') {
                                    let chapterObject = JSON.parse(chapterresponse);

                                    newChapters.chapters.push(count);
                                    chapterList = chapterList.slice(1);
                                    cDB.inputChapter(count, 'false', item.short, m.escapeString('<b>' + chapterObject.data.chapterInfo.chapterIndex + ' - ' + chapterObject.data.chapterInfo.chapterName + '</b><br><br>' + chapterObject.data.chapterInfo.content.replace(/[\n]/g, '<br>')))
                                        .catch(m.promiseError);

                                    m.setAsNewChapter(count, item.short);
                                    m.updateChapter(item.short, count, "quidan");
                                    if (chapterList.length) {
                                        recursiveCrawlingFunction(item, parseInt(count) + 1);
                                    } else {
                                        m.log(5, 'crawlQuidan: Site: ' + item.short + ', Crawl finished at Chapter ' + count);
                                        resolve(newChapters);
                                    }
                                } else {
                                    reject('ObjectError');
                                }
                            });
                        }

                        recursiveCrawlingFunction(item, item.start + 1);
                    } else {
                        m.log(5, 'crawlByLink: Site: ' + item.short + ', no new Chapter. Done.');
                        resolve(newChapters);
                    }

                });
            });
        });
    };

    m.getQuidanToken = (force) => {
        return new Promise((resolve, reject) => {
            if (force || !csrfToken) {
                request({
                    method: 'HEAD',
                    url: `https://www.webnovel.com/`
                }, (err, res, content) => {
                    csrfToken = res.headers['set-cookie'][0].split(';')[0];
                    csrfToken = csrfToken ? csrfToken.split('=')[1] : undefined;
                    if (csrfToken) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            } else {
                resolve();
            }
        });
    };

    m.deleteSeries = (param) => {
        let vars = m.escapeArray(['short'], param);
        Promise
            .all([cDB.deleteStoryTable(vars), cDB.deleteStorySettings(vars)])
            .catch(m.promiseError);
    };

    m.editSeries = (param) => {
        let vars = m.escapeArray(['name', 'short', 'rss', 'url1', 'url2', 'chapter', 'book', 'url3', 'bookChapterReset', 'currentLink', 'minChapterLength', 'bookId'], param);

        return cDB.updateStorySettings(vars)
            .catch(m.promiseError);
    };

    m.escapeArray = (arr, param) => {
        arr.forEach((item) => {
            param[item] = m.escapeString(param[item]);
        });
        return param;
    };

    m.escapeString = (str) => {
        if (typeof(str) === 'string') {
            return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
                switch (char) {
                    case '\0':
                        return '\\0';
                    case '\x08':
                        return '\\b';
                    case '\x09':
                        return '\\t';
                    case '\x1a':
                        return '\\z';
                    case '\n':
                        return '\\n';
                    case '\r':
                        return '\\r';
                    case '"':
                    case '\'':
                    case '\\':
                    case '%':
                        return '\\'+char;
                }
            });
        } else {
            m.log(1, 'escapeString-Error: '+ str +' is no string');
            throw "Not a String-Error!";
        }
    };

    m.getDate = () => {
        var now = new Date();
        return now.getFullYear() + ':' + (now.getMonth() + 1) + ':' + now.getDate() + '-' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    };

    m.getNewChapterList = (userObject) => {
        userObject.new++;
        return new Promise((resolve, reject) => {
            uDB.getNewChapterList(userObject)
            .then((data) => {
                resolve({
                    chapterList: data,
                    chapterNameMap: o.stories.reduce((acc, item) => {
                        acc[item.short] = item.name;
                        return acc;
                    }, {})
                });
            }).catch(reject);
        });
    };

    m.getNotificationSettings = (userObject) => {
        let cleanedUserObject = back.userList.filter(user => user.user == userObject.user)[0];

        return {
            silent: userObject.silent
        };
    };

    m.getOptions = () => {
        m.log(3, 'getting Options');

        return cDB.getOptions()
            .then((data) => {
                o.stories = data;
                o.storyList = o.stories.map(story => story.short);
                if (back.refreshTimer === undefined) {
                    m.registerAutoRefresh();
                }
            })
            .catch(m.promiseError);
    };

    m.getTimeDifference = (time) => {
        let diff = ((new Date().getTime()) - time.getTime()) / 1000,
            seconds = Math.trunc(diff % 60),
            minutes = Math.trunc((diff % 3600) / 60),
            hours = Math.trunc((diff % 86400) / 3600),
            days = Math.trunc(diff / 86400),
            uptime = days + ':' + hours + ':' + minutes + ':' + seconds;

        return {
            string: uptime,
            seconds: seconds,
            minutes: minutes,
            hours: hours,
            days: days
        };
    };

    m.getUrl = (html) => {
        var link,
            match;

        match = html.split(/<[^<A-Za-z]*\/[^<A-Za-z]*a[^<A-Za-z]+/)
                    .map(match => match.split(/<[^<A-Za-z/]*a[^<A-Za-z]+/)[1])
                    .filter(match => match && match.match(/[NneE]?[EeXxNn][EexXtT][xXTt ]?[tT Cc][ CchH][CcHhAa][HhAaPp][AaPpTt][PpTtEe][TtEeRr][EeRr ]?/));

        if (!match.length) {
            //old fallback
            m.log(6, 'getUrl: fallback parse used');
            match = html.match(/[<a[\s\S]{0,50}?href.?=.?["|'][\s\S]{0,120}?["|'][\s\S]{0,50}?>[\s\S]{0,100}?<span[\s\S]{0,100}?[N|n]ext.?[C|c]hapter[\s\S]{0,200}?<\/a>|<a href=".{0,120}?">.?[N|n]ext.?[C|c]hapter.?<\/a>/);
        }

        if (match && typeof(match[0]) === 'string') {
            link = match[0].split(/href.?=.?["|']/)[1].split(/["|']/)[0];
            if (typeof(link) === 'string'){
                m.log(5, 'getUrl: parsed link');
                return link;
            } else {
                m.log(3, 'getUrl: could not parse link');
                return false;
            }
        } else {
            m.log(3, 'getUrl: could not parse body');
            return false;
        }
    };

    m.markAllRead = (userObject) => {
        userObject.new++;
        return uDB.markAllRead(userObject.user);
    };

    m.markStoryRead = (story, userObject) => {
        let item = m.escapeString(story);
        userObject.new++;
        return uDB.markStoryRead(item, userObject.user);
    };

    m.markRead = (param, userObject) => {
        let vars = m.escapeArray(['short', 'chapter','read'], param);
        userObject.new++;
        return (vars.read && vars.read.toString() === 'true') ?
            uDB.markChapterRead(vars, userObject.user) :
            m.setAsNewForUser(vars.chapter, vars.short, userObject);
    };

    m.messageKey = (param, userObject, method) => {
        let currentUser = back.userList.filter((user) => user.user === userObject.user)[0],
            deleteKey = method === 'DELETE';

        if (!deleteKey && !currentUser.subscriptions) {
            currentUser.subscriptions = [param];
        } else if (!deleteKey && currentUser.subscriptions.filter(subscription => subscription.endpoint === param.endpoint).length !== 1) {
            currentUser.subscriptions.push(param);
        } else if (deleteKey && currentUser.subscriptions) {
            currentUser.subscriptions = currentUser.subscriptions.filter(subscription => subscription.endpoint !== param.endpoint);
        }
    };

    m.setNotificationSettings = (param, userObject) => {
        let vars = m.escapeArray(['vibrate', 'silent'], param),
            cleanedUserObject = back.userList.filter(user => user.user == userObject.user)[0];

        userObject.silent = vars.silent;
        cleanedUserObject.silent = vars.silent;

        return uDB.updateUserSettings(userObject);
    };

    m._parseChapterData = (storyList, chapterLists) => {
        let tmpChapterList = [];

        chapterLists.forEach((chapters, index) => {
            if (chapters.length > 0) {
                let _story = storyList[index],
                    parsedChapters = chapters.map((chapterObj) => {
                    return {short: _story, Chapter: chapterObj.Chapter};
                });
                tmpChapterList = tmpChapterList.concat(parsedChapters);
            }
        });

        m.log(4, '_parseChapterData: write temp list onto back.newChapterList');
        back.newChapterList = tmpChapterList;
    };

    m.parseHtml = (html) => {
        var retvar;
        if (html.indexOf('<div itemprop="articleBody">') !== -1){
            var temphtml = html.split('<div itemprop="articleBody">')[1]
                            .split('class="entry-footer"')[0]
                            .replace(/["']/g, "").replace(/<p>/g, '')
                            .replace(/<\/p>/g, '<br>')
                            .replace(/<.?a.*?>/g, '');
            if (typeof(temphtml) === 'undefined') temphtml = '';
            if (temphtml.length > 1000) {
                let content = temphtml.split(/<hr\/>|<hr>/)[1];
                if (!content || content.length < 5000) {
                    content = temphtml.split('Next Chapter')[1];
                    if (!content || content.length < 5000) {
                        return '';
                    }
                }
                return content;
            } else {
                return '';
            }


        } else if (html.indexOf('<article') !== -1) {
            retvar = html.split(/<article.*?>/)[1]
                        .split('</article>')[0]
                        .replace(/<p.*?<a.*?ext Chapter.*?\/p>/, '')
                        .split(/<p[^<]*?<a.*?ext Chapter.*?\/p>/g)[0]
                        .replace(/<script.*?\/script>/, '')
                        .replace(/["']/g, "")
                        .replace(/<p>/g, '')
                        .replace(/<\/p>/g, '<br>')
                        .replace(/<.?a.*?>/g, '');
        }
        retvar = (retvar !== undefined) ? retvar.replace(/<div[\s\S]{0,50}?class="sharedaddy"[\s\S]*?<\/div>/g, '') : "empty";

        return retvar;
    };

    m.promiseError = (errorMessage) => {
        m.log(1, 'Error in Promise: ' + errorMessage);
    };

    m.readFileAssync = (path) => {
        return new Promise((resolve, reject) => {
            fs.readFile(__dirname + path, (err, data) => {
                if (err) reject(err);
                resolve(data);
            });
        });
    };

    m.registerAutoRefresh = () => {
        m.log(1, 'registerAutoRefresh');

        if (back.refreshTimer !== undefined) {
            clearInterval(back.refreshTimer);
        }

        back.refreshTimer = setInterval(() => {
            m.getOptions()
                .then(() => {
                    m.updateDB();
                })
                .catch(m.promiseError);
        }, 60000);
    };

    m.requestChapter = (param, userObject) => {
        let vars = m.escapeArray(['short', 'chapter'], param);
        if (param.addToNew && param.addToNew.toString() === 'true') {
            m.log(4, 'Set ' + param.short + param.chapter + ' as new for User: ' + userObject.user);
            m.setAsNewForUser(param.chapter, param.short, userObject);
        }
        return cDB.requestChapter(vars);
    };

    m.requestFullChapterList = () => {
        const chapterList = [];
        var count = 0;

        return cDB.loadChapterTableList()
            .then((storyNames) => {
                return Promise.all(storyNames.map((story) => cDB.getChapterNumbers(story)))
                    .then((stories) => {
                        return JSON.stringify(stories.reduce((total, item) => total.concat(item), []));
                    })
                    .catch(m.promiseError);
            })
            .catch(m.promiseError);
    };

    m.requestSeriesSettings = () => {
        return cDB.requestSeriesSettings()
            .then((settings) => JSON.stringify(settings))
            .catch(m.promiseError);
    };

    m.restartServer = () => {
        m.log(3, 'restartServer');
        exec(process.env.CRAWLER_HOME + "scripts/restart", (error, stdout, stderr) => {
            m.log(0, stdout + error + stderr);
        });
    };

    m.setAsNewChapter = (chapterNumber, shortName) => {
        if (back.userList && back.userList.length > 0) {
            back.userList.forEach((userObject) => {
                if (userObject.stories.includes(shortName)){
                    m.setAsNewForUser(chapterNumber, shortName, userObject);
                }
            });
        } else {
            m.log(3, 'setAsNewChapter: no users found');
        }
    };

    m.setAsNewForUser = (chapterNumber, shortName, userObject) => {
        m.log(4, 'set as new for user: ' + userObject.user);
        userObject.new++;
        return uDB.addToNewChapter(userObject.user, chapterNumber, shortName);
    };

    m.setLogLevel = (level) => {
        m.log(3, 'sendChapterList: sending chapterlist');
        return new Promise( (resolve, reject) => {
            const lvl = parseInt(level);
            let content,
                filename = process.env.CRAWLER_HOME + 'options.json';

            if (typeof(lvl) !== "number") reject(lvl + "is not a number");

            back.options.log = parseInt(level);

            fs.readFile(filename, (err, data) => {
                if (err) reject(err);
                content = JSON.parse(data);
                content.log = parseInt(level);
                fs.writeFile(filename, JSON.stringify(content), (err2) => {
                    if (err2) reject(err2);
                    resolve();
                });
            });
        });
    };

    m.subscribeSeries = (param, userObject, unsubscribe) => {
        let vars = m.escapeArray(['short'], param);
        m.log(3, 'subscribeSeries: ', unsubscribe, vars.short);
        if (unsubscribe) {
            return uDB.removeUserStory(userObject.id, vars.short)
                .then(() => {
                    let pos = userObject.stories.indexOf(vars.short);
                    if (pos !== -1) {
                        userObject.stories.splice(pos, 1);
                        back.userList.filter((item) => {return (item.id === userObject.id);})[0].stories = userObject.stories;
                    }
                });

        } else {
            return uDB.addUserStory(userObject.id, vars.short)
                .then(() => {
                    let pos = userObject.stories.indexOf(vars.short);
                    if (pos === -1) {
                        userObject.stories.push(vars.short);
                        back.userList.filter((item) => {return (item.id === userObject.id);})[0].stories = userObject.stories;
                    }
                });
        }
    };

    m.status = () => {
        let uptime = m.getTimeDifference(back.startedAt);

        return new Promise((resolve, reject) => {
            cDB.getOptions()
                .then((data) => {
                    let updateData = data
                            .filter(story => {
                                return (((new Date().getTime() - parseInt(story.modified) * 1000) > 1000 * 60 * 60 * 24 * 2) && !story.completed);
                            })
                            .map(story => {
                                return {
                                    short: story.short,
                                    updated: moment(parseInt(story.modified) * 1000).fromNow()
                                };
                            });

                    resolve({
                        usercount: back.userList.length,
                        uptime: uptime.string,
                        slowUpdates: updateData
                    });
                })
                .catch((err) => {
                    m.log(3, 'm.status: error getting update data', err);
                    reject();
                });
        });
    };

    m.triggerBuild = () => {
        m.log(1, 'triggerBuild');
        exec(process.env.CRAWLER_HOME + "scripts/buildCrawler", (error, stdout, stderr) => {
            m.log(0, stdout + error + stderr);
        });
    };

    m.updateChapter = (shortName, start, url) => {
            var query;

            /**********************
            ***   Exceptions    ***
            **********************/

            if (shortName === "ISSTH"){
                if(start === 583 || start === 690) {
                    start++;
                }
            }
            if (shortName === "MGA"){
                if(start === 133) {
                    start++;
                }
            }
            if (shortName === "MW"){
                if(start === 415) {
                    start++;
                }
            }

            /**********************
            ***  Exceptions-End ***
            **********************/

            cDB.updateCurrentChapter(start, shortName, url)
                .catch(m.promiseError);
    };

    m.updateDB = () => {
        let promArr;
        m.log(3, 'updateDB');
        if (!runningCrawls) {
            error = [];
            runningCrawls = true;

            promArr = o.stories.map((item) => {
                error[item.short] = false;
                if (item.currentLink !== "false"){
                    if (item.currentLink === "quidan") {
                        return m.crawlQuidan(item);
                    } else {
                        return m.crawlByLink(item);
                    }
                } else {
                    return m.crawlSite(item);
                }
            });

            Promise.all(promArr)
            .then((newChapters) => {
                let notifyUsers,
                    newChapterStoryList;

                newChapterStoryList = newChapters.reduce((arr, results) => {
                    if (results && results.chapters && results.chapters.length) {
                        arr.push(results);
                    }
                    return arr;
                }, []);
                m.log(3, 'Crawling completed.');
                if (newChapterStoryList.length) {
                    m.log(3, 'got new chapters for ' + newChapterStoryList.map(story => story.short).join(', ') + '.');
                    back.userList.forEach((user) => {
                        let userChapterList = newChapterStoryList.filter(story => user.stories.includes(story.short));
                        if (userChapterList.length > 0 && user.subscriptions && user.subscriptions.length > 0) {
                            m.log(4, 'sending Notification to user' + user.user + ' who has ' + user.subscriptions.length + ' subscriptions.');
                            user.subscriptions.forEach(subscription => message.sendNotification(subscription, JSON.stringify({
                                chapterArray: userChapterList,
                                silent: user.silent
                            }), {TTL: 3600}));
                        }
                    });
                } else {
                   m.log(3, 'No new Chapters.');
                }
                runningCrawls = false;
            })
            .catch((err) => {
                runningCrawls = false;
                m.log(3, 'Crawling completed with errors: ', (err.constructor === Array) ? err.join(', ') : err);
            });
        } else {
            if (crawlerError > 8){
                m.log(2, 'Update Broken: Resetting crawler! ');
                runningCrawls = false;
            } else {
                m.log(3, 'Update still running.');
                crawlerError++;
            }

        }
    };
}

module.exports = methods;
