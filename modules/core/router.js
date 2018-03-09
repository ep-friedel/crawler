function router(back) {
    const   express = require('express')
        ,   app = express()
        ,   bodyparser = require('body-parser')
        ,   server_port = process.env.CRAWLER_PORT || 8080
        ,   server_ip_address = process.env.CRAWLER_IP || 'localhost'
        ,   fs = require('fs')
        ,   auth = require(process.env.CRAWLER_HOME + 'modules/auth/jwt')
        ,   hmac = require(process.env.CRAWLER_HOME + 'modules/auth/hmac')(process.env.GITHUB_SECRET, 'X-Hub-Signature')
        ,   http = require('http')

        ,   h = back.handler
        ,   o = back.options
        ,   m = back.methods
        ,   a = auth(back)
        ,   live = {
                index: fs.readFileSync(process.env.CRAWLER_HOME + 'live/index.html').toString(),
                admin: fs.readFileSync(process.env.CRAWLER_HOME + 'live/admin.html').toString()
            };

    http.createServer(app).listen(server_port, server_ip_address, () => {
        m.log(0, 'listening on port '+ server_port);
    });


    /**************************************************************************************
    **************************            Middleware         ******************************
    **************************************************************************************/


    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({extended: true}));

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Cache-Control, jwt');
        next();
    });


    /**************************************************************************************
    **************************            static             ******************************
    **************************************************************************************/


    app.use('/', express.static(process.env.CRAWLER_HOME + 'Public/live'));
    app.use('/dsa', express.static(process.env.CRAWLER_HOME + 'DSA/file'));
    app.use('/', express.static(process.env.CRAWLER_HOME + 'manifest'));
    app.use('/', express.static(process.env.CRAWLER_HOME + 'Public/live/sw'));
    app.use('/images', express.static(process.env.CRAWLER_HOME + 'Public/images'));
    app.use('/fonts', express.static(process.env.CRAWLER_HOME + 'Public/fonts'));


    /**************************************************************************************
    **************************              Pages            ******************************
    **************************************************************************************/


    app.get('/index', (req, res, next) => {
    res.status(200).send(live.index);
    });

    app.get('/', (req, res, next) => {
    res.redirect('/index');
    });

    app.get('/admin', (req, res, next) => {
    res.status(200).send(live.admin);
    });


    /**************************************************************************************
    **************************              Auth            ******************************
    **************************************************************************************/


    app.post('/login', a.login);


    app.post('/signup', a.isLoggedInAPI, a.isAdmin, a.signUp);

    app.get('/refreshToken', a.isLoggedInAPI, (req, res) => {
        a.createToken(req.user)
            .then((token) => {
                res.status(200).set('Set-Cookie', 'JWT=' + token).send({"token": token});
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    /**************************************************************************************
    **************************               API             ******************************
    **************************************************************************************/

    /*
    ****************************           DELETE          ********************************
    */

    app.delete('/api/subscribeSeries', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:delete:subscribeSeries', (o.log >= 11) ? req : "");
        h.subscribeSeries(req.body, req.user, true)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    app.delete('/api/messageKey', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:delete:messageKey', (o.log >= 11) ? req : "");
        h.messageKey(req.body, req.user, req.method);
        res.status(200).send();
    });

    /*--------------------------------------Admin-----------------------------------------*/

    app.delete('/api/series', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:deleteSeries', (o.log >= 11) ? req : "");
        h.deleteSeries(req.body)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    /*
    ****************************            GET          **********************************
    */

    app.get('/api/getNewChapterList', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:getNewChapterList', (o.log >= 11) ? req : "");
        h.getNewChapterList(req.user).then((data) => {
            res.status(200).send(data);
        }).catch((err) => {
            res.status(500).send();
            m.promiseError(err);
        });
    });

    app.get('/api/requestChapter', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:requestChapter', (o.log >= 11) ? req : "");
        h.requestChapter(req.query, req.user)
            .then((dbres) => {
                m.log(2, 'requestChapter: send Chapter', (o.log >= 11) ? dbres : "");
                res.status(200)
                    .set({
                        'Content-Type': 'text/plain',
                        'Content-Encoding': 'null',
                        'Content-Length': Buffer.byteLength(dbres[0].Content, 'utf8'),
                        'Accept-Ranges': 'bytes'
                    })
                    .send(dbres[0].Content);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send(err);
            });
    });

    app.get('/api/requestFullChapterList', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:requestFullChapterList', (o.log >= 11) ? req : "");
        h.requestFullChapterList()
            .then((dbres) => {
                m.log(2, 'requestFullChapterList: send List', (o.log >= 11) ? dbres : "");
                res.status(200).send(dbres);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    app.get('/api/subscribeSeries', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:get:subscribeSeries', (o.log >= 11) ? req : "");

        let subscription = o.storyList.map(short => {
            return {
                short: short,
                active: req.user.stories.includes(short)
            };
        });
        res.status(200).send(subscription);
    });

    app.get('/api/status', (req, res) => {
        m.log(2, 'API:get:status', (o.log >= 11) ? req : "");
        h.getStatus()
            .then((payload) => {
                res.status(200).send(JSON.stringify(payload));
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    app.get('/api/notificationSettings', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:get:notificationSettings', (o.log >= 11) ? req : "");

        let notificationSettings = h.getNotificationSettings(req.user);

        res.status(200).send(notificationSettings);
    });

    /*--------------------------------------Admin-----------------------------------------*/

    app.get('/api/series', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:series', (o.log >= 11) ? req : "");
        h.requestSeriesSettings()
            .then((dbres) => {
                m.log(2, 'series: send List', (o.log >= 11) ? dbres : "");
                res.status(200).send(dbres);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    /*
    ****************************            POST         **********************************
    */

    app.post('/api/messageKey', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:post:messageKey', (o.log >= 11) ? req : "");
        h.messageKey(req.body, req.user, req.method);
        res.status(200).send();
    });

    app.post('/api/triggerBuild', hmac, (req, res) => {
        m.log(2, 'API:post:triggerBuild', (o.log >= 11) ? req : "");
        h.triggerBuild();
        res.status(200).send();
    });

    app.post('/api/notificationSettings', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:post:notificationSettings', (o.log >= 11) ? req : "");
        h.setNotificationSettings(req.body, req.user)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                m.promiseError(err);
                res.status(500).send(err);
            });
    });

    app.post('/api/subscribeSeries', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:post:subscribeSeries', (o.log >= 11) ? req : "");
        h.subscribeSeries(req.body, req.user, false)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                m.promiseError(err);
                res.status(500).send(err);
            });
    });

    /*--------------------------------------Admin-----------------------------------------*/

    app.post('/api/series', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:series:post', (o.log >= 11) ? req : "");
        h.addSeries(req.body)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                m.promiseError(err);
                res.status(500).send();
            });
    });

    /*
    ****************************            PUT          **********************************
    */

    app.put('/api/manualRefresh', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:manualRefresh', (o.log >= 11) ? req : "");
        h.manualRefresh();
        res.status(200).send();
    });

    app.put('/api/markNew', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:markNew', (o.log >= 11) ? req : "");
        h.markNew(req.query, req.user).then(() => {
            res.status(200).send();
        })
        .catch((err) => {
            res.status(500).send();
            m.promiseError(err);
        });
    });

    app.put('/api/markAllRead', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:markAllRead', (o.log >= 11) ? req : "");
        h.markAllRead(req.query, req.user).then(() => {
            res.status(200).send();
        })
        .catch((err) => {
            res.status(500).send();
            m.promiseError(err);
        });
    });

    app.put('/api/markRead', a.isLoggedInAPI, (req, res) => {
        m.log(2, 'API:markRead', (o.log >= 11) ? req : "");
        h.markRead(req.query, req.user).then(() => {
            res.status(200).send();
        })
        .catch((err) => {
            res.status(500).send();
            m.promiseError(err);
        });
    });

    /*--------------------------------------Admin-----------------------------------------*/

    app.put('/api/resetChapterDB', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:resetChapterDB', (o.log >= 11) ? req : "");
        h.resetChapterDB();
        res.status(200).send();
    });

    app.put('/api/restartServer', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:restartServer', (o.log >= 11) ? req : "");
        h.restartServer();
        res.status(200).send();
    });

    app.put('/api/setLogLevel', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:setLogLevel:put', (o.log >= 11) ? req : "");
        h.setLogLevel(req.query)
            .then(() => {
                m.log(4, 'API:setLogLevel:put - success', (o.log >= 11) ? req : "");
                res.status(200).send();
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });

    app.put('/api/series', a.isLoggedInAPI, a.isAdmin, (req, res) => {
        m.log(2, 'API:series:put', (o.log >= 11) ? req : "");
        h.editSeries(req.body)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send();
            });
    });
}

module.exports = router;