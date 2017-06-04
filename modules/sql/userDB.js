function userDB (back) {
    const   mysql = require('mysql'),
            o = back.options,
            m = back.methods,
            q = {},
            DBName = 'users',
            settingsDB = 'settings';

    let userDb = mysql.createConnection({
          host     : process.env.CRAWLER_DB_HOST,
          port     : process.env.CRAWLER_DB_PORT,
          user     : process.env.CRAWLER_DB_USERNAME,
          password : process.env.CRAWLER_DB_PASSWORD,
          database : DBName
        });

    userDb.on('error', (err) => {
        if (err)
            m.log(1, 'MySQL-ConnectionError: ' + err);
    });

    userDb.connect((err) => {
            if (err) {
                m.log(1, 'MySQL-ConnectionError: ' + err);
            } else {
                m.log(0, 'Connected to MySQL-User-DB.');
            }
    });



    /***************************************************
    ****************    users database   ************
    ***************************************************/

    q.addToNewChapter = (user, chapterNumber, shortName) => {
        return new Promise((resolve, reject) => {
            userDb.query('INSERT INTO  `' + DBName + '`.`' + user + '` (`Chapter`,`short`) VALUES ("' + chapterNumber + '", "' + shortName + '") ON DUPLICATE KEY UPDATE `Chapter` = `Chapter`',
            (err, result) => {
                if (err) {
                    reject(err);
                }
                m.log(6, 'addToNewChapter: User: ' + user + ', added Chapter ' + shortName + chapterNumber + ' to reading list.');
                resolve();
            });
        });
    };

    q.createUserTable = (user) => {
        return new Promise((resolve, reject) => {
            userDb.query('CREATE TABLE IF NOT EXISTS `' + user+ '` ( `short` varchar(20) NOT NULL, `Chapter` varchar(20) NOT NULL, UNIQUE KEY `Chapter` (`Chapter`, `short`) )',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }

                    m.log(4, 'mysql-createUserTable: User: ' + user + ', created user table');
                    resolve();
            });
        });
    };

    q.markStoryRead = (short, user) => {
        return new Promise((resolve, reject) => {
            userDb.query('DELETE FROM `' + DBName + '`.`' + user + '` WHERE `short` = "' + short + '" ',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(3, 'markStoryRead: marked Story ' + short);
                });
        });
    };

    q.markAllRead = (user) => {
        return new Promise((resolve, reject) => {
            userDb.query('TRUNCATE `' + DBName + '`.`' + user + '`',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                    m.log(3, 'markAllRead: marked all read');
                });
        });
    };

    q.markChapterRead = (params, user) => {
        return new Promise((resolve, reject) => {
            userDb.query('DELETE FROM `' + DBName + '`.`' + user + '` WHERE `short` = "' + params.short + '" AND `Chapter` = "' + params.chapter + '" ',
                (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(3, 'markRead: marked story ' + params.short + ' - ' + params.chapter + ' read.');
                    resolve();
                });
        });
    };

    q.getNewChapterList = (userObject) => {
        return new Promise((resolve, reject) => {
            userDb.query('SELECT * FROM  `' + DBName + '`.`' + userObject.user + '`', (err, data) => {
                if (err) {
                    reject(err);
                }
                m.log(3, 'getNewChapterList: got new chapters list');
                if (data.length > 0)
                    data[0].new = userObject.new;
                resolve(data);
            });
        });
    };

    /***************************************************
    ****************    Settings database   ************
    ***************************************************/

    q.getAllUserSettings = () => {
        return new Promise((resolve, reject) => {
            userDb.query('SELECT * FROM  `' + settingsDB + '`.`users`', (err, data) => {
                if (err) {
                    reject(err);
                }
                m.log(3, 'getAllUserSettings: got user settings');
                resolve(data);
            });
        });
    };

    q.getUserStories = (param) => {
        return new Promise((resolve, reject) => {
            userDb.query('SELECT `short` FROM `' + settingsDB + '`.`userChapterSettings` WHERE `id` = "' + param.id + '";',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(6, 'getUserStories: got stories for user with id: ' + param.id + '.');
                    resolve(result);
                });
        });
    };

    q.addUserStory = (id, short) => {
        return new Promise((resolve, reject) => {
            userDb.query('INSERT INTO `' + settingsDB + '`.`userChapterSettings` ( `id`, `short`) VALUES ( "' + id + '", "' + short + '") ON DUPLICATE KEY UPDATE id=id;',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'mysql-addUserStory: User-Id: ' + id + ', input userStory');
                    resolve();
            });
        });
    };

    q.removeUserStory = (id, short) => {
        return new Promise((resolve, reject) => {
            userDb.query('DELETE FROM `' + settingsDB + '`.`userChapterSettings` WHERE `id` = "' + id + '" AND `short` = "' + short + '";',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'mysql-removeUserStory: User-Id: ' + id + ', removed userStory');
                    resolve();
            });
        });
    };

    q.insertUserSettings = (param) => {
        return new Promise((resolve, reject) => {
            userDb.query('INSERT INTO `' + settingsDB + '`.`users` ( `user`, `password`) VALUES ( "' + param.user + '", "' + param.password + '");',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'mysql-insertUserSettings: User: ' + param.user + ', input settings row');
                    resolve();
            });
        });
    };

    q.updateUserSettings = (param) => {
        return new Promise((resolve, reject) => {
            userDb.query('UPDATE `' + settingsDB + '`.`users` SET `user` = "' + param.user + '", `password` = "' + param.password + '", `role` = "' + param.role + '", `silent` = "' + param.silent + '" WHERE `id` = "' + param.id + '";',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(4, 'mysql-updateUserSettings: User: ' + param.user + ', input settings row');
                    resolve();
            });
        });
    };

    q.deleteUserSettings = (id) => {
        return new Promise((resolve, reject) => {
            userDb.query('DELETE FROM `' + settingsDB + '`.`users` WHERE `id` = "' + id + '";',
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    m.log(3, 'deleteUserSettings: deleted user with id: ' + id + '.');
                    resolve();
                });
        });
    };

    return q;
}

module.exports = userDB;