function methods (back) {
    const   exec        = require('child_process').execFile
        ,   fs          = require('fs')
        ,   logger      = require(process.env.CRAWLER_HOME + 'modules/log/logger')(back)
        ,   chapterDB   = require(process.env.CRAWLER_HOME + 'modules/sql/chapterDB')(back)
        ,   userDB      = require(process.env.CRAWLER_HOME + 'modules/sql/userDB')(back)
        ,   wwcCrawler  = require('./wwc')
        ,   pdf         = require('./parsePdf')
        ,   moment      = require('moment');

    const   m = back.methods
        ,   o = back.options
        ,   cDB = chapterDB
        ,   uDB = userDB;

    let runningCrawls = false,
        error = [],
        crawlerError = 0,
        runningParse = false;

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

    m.parsePdf = (short, name) => {
        if (runningParse) {
            return Promise.reject('parse already running, please parse only one file at a time')
        }
        runningParse = true
        return pdf(short)
            .then((pages) => {
                return Promise.all([
                        cDB.insertStorySettings({short, name, currentLink: 'pdf', rss: 'pdf', minChapterLength: 1 }),
                        cDB.createStoryTable({short, name, currentLink: 'pdf', rss: 'pdf', minChapterLength: 1 })
                    ])
                    .then(() => {
                        let promise = Promise.resolve()

                        pages.forEach((text, index) => {
                            promise = promise.then(() => cDB.inputChapter(index + 1, 'false', short, text))
                            .then(() => m.log(5, 'parsePdf: story: ' + short + ', Chapter: ', index + 1, ' - inserted successfully!'))
                            .then(() => new Promise(resolve => setTimeout(() => resolve(), 100)))
                        })

                        return promise
                    })
                    .then(() => m.updateChapter(short, pages.length))
                    .catch(m.promiseError)
                    .then(() => {
                        runningParse = false
                    })
            })
    }

    m.crawlWWC = (item) => {
        let newChapters = {
            short: item.short,
            chapters: []
        };

        m.log(5, 'crawlWWC : story: ' + item.short + ', Chapter: ', item.start);
        return wwcCrawler(item)
            .then(({chapters, currentLink}) => {
                m.log(5, 'crawlWWC: story: ' + item.short + ', Chapter: ', item.start, ' - got ', chapters.length, ' chapters');
                if (!chapters.length) return Promise.resolve(newChapters)

                const updateChapters = Promise.all(chapters.map((chapter, index) => {
                    const id = item.start + index + 1;
                    m.setAsNewChapter(id, item.short);
                    return cDB.inputChapter(id, 'false', item.short, chapter)
                        .then(() => m.log(5, 'crawlWWC: story: ' + item.short + ', Chapter: ', id, ' - inserted successfully!'));
                }));

                m.updateChapter(item.short, item.start + chapters.length, currentLink);

                newChapters.chapters = chapters.map((chapter, index) => item.start + index + 1);
                return updateChapters.then(() => newChapters, err => m.log(3, 'crawlWWC: story: ' + item.short, err))
            })
            .catch(err => {
                m.log(3, 'crawlWWC: story: ' + item.short + ', Chapter: ', item.start, ' - error crawling: ', err)
            })

    }

    m.deleteSeries = (param) => {
        let vars = m.escapeArray(['short'], param);
        return Promise
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

    m.setNotificationSettings = (param, userObject) => {
        let vars = m.escapeArray(['silent'], param),
            cleanedUserObject = back.userList.filter(user => user.user == userObject.user)[0];

        userObject.silent = vars.silent;
        cleanedUserObject.silent = vars.silent;

        return uDB.updateUserSettings(userObject);
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

    m.getDate = () => {
        var now = new Date();
        return now.getFullYear() + ':' + (now.getMonth() + 1) + ':' + now.getDate() + '-' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    };

    m.triggerBuild = () => {
        m.log(1, 'triggerBuild');
        exec(process.env.CRAWLER_HOME + "scripts/buildCrawler", (error, stdout, stderr) => {
            m.log(0, stdout + error + stderr);
        });
    };

    m.updateChapter = (shortName, start, url) => {
            var query;

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
                if (item.currentLink !== "false" && item.rss === 'wwc') {
                    return m.crawlWWC(item).catch((err) => {
                        m.log(3, `CrawlingError in ${item.short}:`, err)
                        return Promise.resolve({
                            short: item.short,
                            chapters: []
                        })
                    })
                }
                return Promise.resolve({
                    short: item.short,
                    chapters: []
                })
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
