function chapterDB(back) {
    const   mysql = require('mysql'),
            o = back.options,
            m = back.methods,
            q = {},
            DBName = 'chapters',
            settingsDB = 'settings';

    let db = mysql.createConnection({
          host     : process.env.CRAWLER_DB_HOST,
          port     : process.env.CRAWLER_DB_PORT,
          user     : process.env.CRAWLER_DB_USERNAME,
          password : process.env.CRAWLER_DB_PASSWORD,
          database : DBName
        });

    db.on('error', (err) => {
        if (err)
            m.log(1, 'MySQL-ConnectionError: ' + err);
    });

    db.connect((err) => {
            if (err) {
                m.log(1, 'MySQL-ConnectionError: ' + err);
            } else {
                m.log(0, 'Connected to MySQL-DB.');
                m.getOptions()
                    .catch(m.promiseError);
            }
    });

    /***************************************************
    ****************    Chapters database   ************
    ***************************************************/

    q.createStoryTable = (param) => {
        return new Promise((resolve, reject) => {
            db.query('CREATE TABLE IF NOT EXISTS `' + param.short + '` ( `Chapter` varchar(20) NOT NULL, `Content` mediumtext NOT NULL, `read` varchar(10) NOT NULL DEFAULT "false", UNIQUE KEY `Chapter` (`Chapter`) )',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }

                    m.log(4, 'mysql-createStoryTable: Story: ' + param.short + ', created chapter table');
                    resolve();
            });
        });
    };

    q.deleteStoryTable = (param) => {
        return new Promise((resolve, reject) => {
            if (param.short === "settings" || param.short === "options") reject();

            db.query('DROP TABLE IF EXISTS `' + DBName + '`.`' + param.short + '`;',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'deleteSeries: Site: ' + param.short + ', deleted table');
                });
        });
    };

    q.getChapterNumbers = (storyName) => {
        return new Promise((resolve, reject) => {
            db.query('SELECT `Chapter` FROM `' + storyName + '`',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'requestFullChapterList: got Chapter List for ' + storyName);
                    resolve({short: storyName, chapters: res});
                });
        });
    };

    q.inputChapter = (startNumber1, startNumber2, storyName, content) => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO  `' + DBName + '`.`' + storyName + '` (`Chapter`,`Content`) VALUES ("' + ((startNumber2 !== 'false') ? (startNumber2 + '.' + startNumber1) : startNumber1) + '", ' + mysql.escape(content) + ') ON DUPLICATE KEY UPDATE `Content`=' + mysql.escape(content),
            (err, result) => {
                if (err) {
                    reject(err);
                }
                m.log(4, 'crawlSite: Site: ' + storyName + ', inserted HTML into DB');
                resolve();
            });
        });
    };

    q.loadChapterTableList = () => {
        return new Promise((resolve, reject) => {
            db.query('select table_name from information_schema.tables where `TABLE_SCHEMA` like "' + DBName + '" and not table_name like "settings" and not table_name like "options"',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(res.map((item) => item.table_name));
                });
        });
    };

    q.requestChapter = (param) => {
        return new Promise((resolve, reject) => {
            db.query('select `Content` from ' + param.short + ' where `Chapter` like "' + param.chapter + '"', (err, res) => {
                m.log(4, 'requestChapter: got Chapter');
                if (err) {
                    reject(err);
                }
                resolve(res);
            });
        });
    };

    /***************************************************
    ****************    Settings database   ************
    ***************************************************/

    q.deleteStorySettings = (param) => {
        return new Promise((resolve, reject) => {
            db.query('DELETE FROM `' + settingsDB + '`.`chapters` WHERE `short` = "' + param.short + '";',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'deleteSeries: Site: ' + param.short + ', deleted settings');
                    resolve();
                });
        });
    };

    q.getOptions = () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM  `' + settingsDB + '`.`chapters`', (err, data) => {
                if (err) {
                    reject(err);
                }
                m.log(3, 'getOptions: got stories');
                resolve(data);
            });
        });
    };

    q.insertStorySettings = (param) => {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO `' + settingsDB + '`.`chapters` ( `name`, `short`, `rss`, `minChapterLength`, `url1`, `url2`, `start`, `start2`, `url3`, `bookChapterReset`, `currentLink`, `bookId`) VALUES ( "' + param.name + '", "' + param.short + '", "' + param.rss + '", "' + (param.minChapterLength || 5000) + '", "' + param.url1 + '", "' + param.url2 + '", "' + (param.chapter || 0) + '", "' + param.book + '", "' + param.url3 + '", "' + (param.bookChapterReset || 0) + '", "' + param.currentLink + '", "' + param.bookId + '");',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'mysql-insertStorySettings: Story: ' + param.short + ', input settings row');
                    resolve();
            });
        });
    };

    q.requestSeriesSettings = () => {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM `' + settingsDB + '`.`chapters`',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(3, 'requestSeriesSettings: got settings');
                    resolve(res);
                }
            );
        });
    };

    q.updateCurrentChapter = (startNumber1, shortName, url) => {
        return new Promise((resolve, reject) => {
            let query = "UPDATE  `" + settingsDB + "`.`chapters` SET  `start` =  '" + startNumber1 + ((url !== undefined) ? ("', `currentLink` =  '" + url) : "") + "' WHERE  `short` = '" + shortName + "';";
            db.query(query,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'crawlSite: Site: ' + shortName + ', updated chapter number to', startNumber1);
                    resolve();
                });
        });
    };

    q.updateStorySettings = (param) => {
        return new Promise((resolve, reject) => {
            db.query('UPDATE `' + settingsDB + '`.`chapters` SET `name` = "' + param.name + '", `rss` = "' + param.rss + '", `minChapterLength` = "' + param.minChapterLength + '", `url1` = "' + param.url1 + '", `url2` = "' + param.url2 + '", `start` = "' + ((param.book !== undefined) ? param.chapter : param.book) + '", `start2` = "' + ((param.book !== undefined) ? param.book : param.chapter) + '", `url3` = "' + param.url3 + '", `bookChapterReset` = "' + param.bookChapterReset + '", `bookId` = "' + param.bookId + '", `currentLink` = "' + param.currentLink + '" WHERE `short` = "' + param.short + '";',
            (err, result) => {
                if (err) {
                    reject(err);
                }
                m.log(4, 'editSeries: Site: ' + param.short + ', input settings');
                resolve(result);
            });
        });
    };

    q.updateStorySettingsWithBooks = (startNumber2, storyName) => {
        return new Promise((resolve, reject) => {
            db.query("UPDATE  `" + settingsDB + "`.`chapters` SET  `start2` =  '" + startNumber2 + "' WHERE  `short` = '" + storyName + "';",
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'crawlSite: Site: ' + storyName + ', updated book number to', startNumber2);
                    resolve();
                });
        });
    };

    return q;
}

module.exports = chapterDB;