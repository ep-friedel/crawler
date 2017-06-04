const admin = {
    serverActions : {}
,   options: {}
,   vars: {
        seriesType: 'oneVar'
    }
,   methods: {}
,   handler: {}
,   proto: {}
};

admin.serverActions.markRead = (shortname, chapter) => {
    const http = new XMLHttpRequest(),
          url = '/api/markRead?short=' + shortName + '&chapter=' + chapter;

    http.open('PUT', url, true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.onreadystatechange = () => {
        if(http.readyState == 4 && http.status == 200) {

        }
    };
    http.send();
};

admin.serverActions.setLogLevel = (level) => {
    const http = new XMLHttpRequest(),
          url = '/api/setLogLevel?Level=' + level;

    http.open('PUT', url, true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.onreadystatechange = () => {
        if(http.readyState == 4 && http.status == 200) {

        }
    };
    http.send();
};

admin.serverActions.markAllRead = (data) => {
    const http = new XMLHttpRequest(),
          url = '/api/markAllRead' + data;

    http.open('PUT', url, true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.onreadystatechange = () => {
        if(http.readyState == 4 && http.status == 200) {

        }
    };
    http.send();
};

admin.serverActions.resetChapterDB = () => {
    const http = new XMLHttpRequest();

    http.open('PUT', '/api/resetChapterDB', true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.onreadystatechange = () => {
        if(http.readyState == 4 && http.status == 200) {

        }
    };
    http.send();
};

admin.serverActions.restartServer = () => {
    const http = new XMLHttpRequest();

    http.open('PUT', '/api/restartServer', true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.send();
};

admin.serverActions.getSeriesSettings = () => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        http.open('GET', '/api/series', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", admin.vars.jwt);
        http.onreadystatechange = () => {
            if(http.readyState == 4 && http.status == 200) {
                resolve(JSON.parse(http.response));
            }
        };
        http.send();
    });
};

admin.serverActions.getFullChapterList = () => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        http.open('GET', '/api/requestFullChapterList', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", admin.vars.jwt);
        http.onreadystatechange = () => {
            if(http.readyState == 4 && http.status == 200) {
                admin.vars.fullChapterList = JSON.parse(http.response.replace(/{"Chapter":(.*?)}/g, '$1'));
                admin.vars.fullChapterList.forEach((item) => {
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
                });
                resolve();
            }
        };
        http.send();
    });
};

admin.serverActions.deleteSeries = (dataString) => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject)=>{
        http.open('DELETE', '/api/series', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", admin.vars.jwt);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200) {
                resolve();
            } else if(http.readyState === 4 && http.status !== 200) {
                reject();
            }
        };
        http.send(dataString);

    });
};

admin.serverActions.series = (dataString, edit) => {
    const http = new XMLHttpRequest();

    return new Promise((resolve, reject)=>{
        http.open((edit) ? 'PUT' : 'POST', '/api/series', true);
        http.setRequestHeader("Cache-Control", "no-Cache");
        http.setRequestHeader("jwt", admin.vars.jwt);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200) {
                resolve();
            } else if(http.readyState === 4 && http.status !== 200) {
                reject();
            }
        };
        http.send(dataString);

    });
};

admin.serverActions.manualRefresh = () => {
    const http = new XMLHttpRequest();

    http.open('PUT', '/api/manualRefresh', true);
    http.setRequestHeader("Cache-Control", "no-Cache");
    http.setRequestHeader("jwt", admin.vars.jwt);
    http.send();
};



admin.handler.showProperty = (event) => {
    const item = event.currentTarget.nextElementSibling;    /*srcElement --> currentTarget*/
    if (item.className.indexOf('hideSoft') !== -1) {
        item.className = item.className.replace(/ hideSoft/g, '');
    } else {
        item.className += ' hideSoft';
    }
};

admin.handler.resetChapterDB = (event) => {
    const item = event.currentTarget;   /*srcElement --> currentTarget*/
    if (item.className.indexOf('confirm') !== -1) {
        admin.serverActions.resetChapterDB();
        clearInterval(admin.vars.resetChapterDBTimer);
        item.className = item.className.replace(' confirm', '');
    } else {
        item.className += ' confirm';
        admin.vars.resetChapterDBTimer = setInterval(() => {
            item.className = item.className.replace(' confirm', '');
            clearInterval(admin.vars.resetChapterDBTimer);
        },5000);
    }
};

admin.handler.restartServer = (event) => {
    const item = event.currentTarget;

    if (item.className.indexOf('confirm') !== -1) {
        admin.serverActions.restartServer();
        clearInterval(admin.vars.markAllReadTimer);
        item.className = item.className.replace(' confirm', '');
    } else {
        item.className += ' confirm';
        admin.vars.markAllReadTimer = setInterval(() => {
            item.className = item.className.replace(' confirm', '');
            clearInterval(admin.vars.markAllReadTimer);
        },5000);
    }
};

admin.handler.markAllRead = (event) => {
    const item = event.currentTarget    /*srcElement --> currentTarget*/
    ,     dataUrl = (admin.vars.markRead === 'chapter') ? ('?short=' + admin.vars.markReadStorySelector.getValue()) : '';
    if (item.className.indexOf('confirm') !== -1) {
        admin.serverActions.markAllRead(dataUrl);
        clearInterval(admin.vars.markAllReadTimer);
        item.className = item.className.replace(' confirm', '');
    } else {
        item.className += ' confirm';
        admin.vars.markAllReadTimer = setInterval(() => {
            item.className = item.className.replace(' confirm', '');
            clearInterval(admin.vars.markAllReadTimer);
        },5000);
    }
};

admin.handler.markAllReadToggle = (event) => {
    const item = event.currentTarget;
    if (item.className.indexOf(' on') !== -1) {
        item.className = item.className.replace(' on', '');
        admin.vars.markRead = "chapter";
        admin.vars.markReadStorySelector.target.className = admin.vars.markReadStorySelector.target.className.replace(/ hideSoft/g, '');
    } else {
        item.className += ' on';
        admin.vars.markRead = "all";
        admin.vars.markReadStorySelector.target.className += ' hideSoft';
    }
};

admin.handler.toggleAddSeries = (event) => {
    const   elems = Array.from(document.querySelector('.inputSettings').children)
    ,       items = Array.from(document.querySelector('.inputContainer').children)
    ,       type = event.currentTarget.id;
    var cnt;

    elems.forEach((item)=> {
        if (item.className.indexOf('active') !== -1) {
            item.className = item.className.replace(' active', '');
        }
    });

    event.currentTarget.className+= ' active';
    admin.vars.seriesType = event.currentTarget.id;

    items.forEach((item)=> {
        if (item.className.indexOf('hideSoft') === -1) {
            item.className += ' hideSoft';
        }
    });

    if (type === 'oneVar') {
        [6,1,2,3,4,5,11].forEach((cnt) => {
            items[cnt].className = items[cnt].className.replace(/ hideSoft/g, '');
        });
        [10,7,8,9].forEach((cnt) => {
            items[cnt].children[1].value = items[cnt].children[1].defaultValue;
        });
    } else if (type === 'twoVar'){
        [8,1,2,3,4,5,6,7,10,11].forEach((cnt) => {
            items[cnt].className = items[cnt].className.replace(/ hideSoft/g, '');
        });

        items[9].children[1].value = items[9].children[1].defaultValue;

    } else if (type === 'link'){
        [3,1,2,9,11].forEach((cnt) => {
            items[cnt].className = items[cnt].className.replace(/ hideSoft/g, '');
        });

        [8,4,5,6,7,10].forEach((cnt) => {
            items[cnt].children[1].value = items[cnt].children[1].defaultValue;
        });
    }
    if (document.querySelector('#editSeries').className.indexOf('active') !== -1) {
        items[0].className = items[0].className.replace(/ hideSoft/g, '');
        items[1].className  += ' hideSoft';
    }
};

admin.handler.toggleAddEditSeries = (event) => {
    const   elems = Array.from(document.querySelector('.addOrEdit').children)
    ,       items = Array.from(document.querySelector('.inputContainer').children)
    ,       typeRow = document.querySelector('.inputSettings')
    ,       editSeriesButton = document.querySelector('#editSeriesButton')
    ,       addSeriesButton = document.querySelector('#addSeriesButton')
    ,       deleteSeriesButton = document.querySelector('#deleteSeriesButton')
    ,       type = event.currentTarget.id;
    var cnt;

    elems.forEach((item)=> {
        if (item.className.indexOf('active') !== -1) {
            item.className = item.className.replace(' active', '');
        }
    });

    event.currentTarget.className+= ' active';
    admin.vars.seriesType = event.currentTarget.id;

    items.forEach((item)=> {
        if (item.className.indexOf('hideSoft') === -1) {
            item.className += ' hideSoft';
            item.value = "";
        }
    });

    if (type === 'editSeries') {
        items[0].className = items[0].className.replace(/ hideSoft/g, '');
        typeRow.className = typeRow.className.replace(/ hideSoft/g, '');
        addSeriesButton.className += ' hideSoft';
        deleteSeriesButton.className += ' hideSoft';
        editSeriesButton.className = editSeriesButton.className.replace(/ hideSoft/g, '');
        admin.serverActions.getSeriesSettings()
            .then((settings)=>{
                var value = admin.vars.editStoryTagPicker.getValue();
                admin.methods.applySettings(settings.filter((item) => {return (item.short === value);}));
            });

    } else if (type === 'addNewSeriesButton'){
        typeRow.className = typeRow.className.replace(/ hideSoft/g, '');
        editSeriesButton.className += ' hideSoft';
        deleteSeriesButton.className += ' hideSoft';
        addSeriesButton.className = addSeriesButton.className.replace(/ hideSoft/g, '');
        document.querySelector('.inputSettings > .active').click();

    } else if (type === 'deleteSeries'){
        typeRow.className += ' hideSoft';
        editSeriesButton.className += ' hideSoft';
        addSeriesButton.className += ' hideSoft';
        deleteSeriesButton.className = deleteSeriesButton.className.replace(/ hideSoft/g, '');
        items[0].className = items[0].className.replace(/ hideSoft/g, '');
    }
};

admin.handler.readerLink = (event) => {
    location.href="/";
};

admin.handler.deleteSeries = (event) => {
    const   short = admin.vars.editStoryTagPicker.getValue()
    ,       item = event.currentTarget;

    if (item.className.indexOf('confirm') !== -1) {
        clearInterval(admin.vars.deleteSeriesTimer);
        item.className = item.className.replace(' confirm', '');
    } else {
        item.className += ' confirm';
        admin.vars.deleteSeriesTimer = setInterval(() => {
            item.className = item.className.replace(' confirm', '');
            clearInterval(admin.vars.deleteSeriesTimer);
        },5000);
        return;
    }

    dataString = 'short='+ short;

    admin.serverActions.deleteSeries(dataString)
        .then(()=>{
            admin.methods.clearAddSeriesInput();
            admin.methods.renewSliders();
        }).catch((err)=>{

        });
};

admin.handler.addSeries = (edit, event) => {
    const   name = document.querySelector('#nameField').value
    ,       short = document.querySelector('#shortField').value
    ,       rss = document.querySelector('#rssField').value
    ,       url1 = document.querySelector('#url1Field').value
    ,       url2 = document.querySelector('#url2Field').value
    ,       url3 = document.querySelector('#url3Field').value
    ,       var1 = document.querySelector('#var1Field').value
    ,       var2 = document.querySelector('#var2Field').value
    ,       currentLink = document.querySelector('#currentLinkField').value
    ,       bookChapterReset = document.querySelector('#bookChapterResetField').value
    ,       minChapterLength = document.querySelector('#minChapLen').value
    ,       item = event.currentTarget;

    if (item.className.indexOf('confirm') !== -1) {
        clearInterval(admin.vars.seriesTimer);
        item.className = item.className.replace(' confirm', '');
    } else {
        item.className += ' confirm';
        admin.vars.seriesTimer = setInterval(() => {
            item.className = item.className.replace(' confirm', '');
            clearInterval(admin.vars.seriesTimer);
        },5000);
        return;
    }

    dataString = 'name=' + name + '&short='+ short + '&url1='+ url1 + '&url2='+ url2 + '&url3='+ url3  + '&currentLink='+ currentLink + '&bookChapterReset='+ bookChapterReset + '&rss=' + rss + '&minChapterLength=' + minChapterLength;
    if (admin.vars.seriesType === "oneVar"||admin.vars.seriesType === "link") {
        dataString += '&book=false&chapter='+ var1;
    } else {
        dataString += '&book=' + var1 + '&chapter='+ var2;
    }

    admin.serverActions.series(dataString, (edit) ? true : false )
        .then(()=>{
            admin.methods.clearAddSeriesInput();
            admin.methods.renewSliders();
        }).catch(()=>{

        });
};

admin.handler.setLogLevel = () => {
    admin.serverActions.setLogLevel(admin.vars.logLevelPicker.getValue());
};



admin.methods.applySettings = (item) => {
    const buttons   = document.querySelectorAll('.inputSettings p')
    ,     inputs     = document.querySelectorAll('.inputContainer input');

    if (document.querySelector('#editSeries').className.indexOf('active') !== -1) {
        buttons[(item[0].url1.length < 2) ? 2 : (item[0].start2 === 'false') ? 0 : 1].click();
        inputs[0].value = item[0].short;
        inputs[1].value = item[0].name;
        inputs[2].value = item[0].rss;
        inputs[3].value = item[0].url1;
        inputs[4].value = item[0].start;
        inputs[5].value = item[0].url2;
        inputs[6].value = item[0].start2;
        inputs[7].value = item[0].url3;
        inputs[8].value = item[0].currentLink;
        inputs[9].value = item[0].bookChapterReset;
        inputs[10].value = item[0].minChapterLength;
    }
};

admin.methods.clearAddSeriesInput = () => {
    const   items = Array.from(document.querySelector('.inputContainer').children);
    items.forEach((item)=> {
        if (item.children[1] === undefined) return;
        item.children[1].value = item.children[1].defaultValue;
    });
};

admin.methods.renewSliders = () => {
    admin.serverActions.getFullChapterList().then(() => {

        admin.vars.removeChapterStorySelector.newData(admin.vars.fullChapterList, 'short');
        admin.vars.markReadStorySelector.newData(admin.vars.fullChapterList, 'short');
        admin.vars.editStoryTagPicker.newData(admin.vars.fullChapterList, 'short');
    });
};



admin.proto.picker = function(options, cb) {
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



document.addEventListener('DOMContentLoaded', () => {
    admin.vars.jwt = localStorage.jwt;

    admin.serverActions.getFullChapterList().then(() => {

        admin.vars.removeChapterStorySelector = new admin.proto.picker({
            target: document.querySelector('#removeChapterPicker')
        ,   frameClass: 'storypicker'
        ,   tagClass: 'storyTag'
        ,   listClass: 'story list'
        ,   tag: 'Story:'
        ,   data: admin.vars.fullChapterList
        ,   dataprop: 'short'
            },(position, value) => {
                if (admin.vars.removeChapterChapterSelector === undefined) return;
                admin.vars.removeChapterChapterSelector.newData(admin.vars.fullChapterList[position].chapters);
                admin.vars.removeChapterChapterSelector.goto(admin.vars.fullChapterList[position].chapters.length-1);
        });

        admin.vars.removeChapterChapterSelector = new admin.proto.picker({
            target: document.querySelector('#removeChapterPicker')
        ,   frameClass: 'chapterpicker'
        ,   tagClass: 'chapterTag'
        ,   listClass: 'chapter list'
        ,   tag: 'Chapter:'
        ,   data: admin.vars.fullChapterList[0].chapters
        ,   factor: 5
        });
        admin.vars.removeChapterChapterSelector.goto(admin.vars.fullChapterList[0].chapters.length-1);

        admin.vars.markReadStorySelector = new admin.proto.picker({
            target: document.querySelector('#markReadStoryPicker')
        ,   frameClass: 'storypicker'
        ,   tagClass: 'storyTag'
        ,   listClass: 'story list'
        ,   tag: 'Select Story:'
        ,   data: admin.vars.fullChapterList
        ,   dataprop: 'short'
        });

        admin.vars.editStoryTagPicker = new admin.proto.picker({
            target: document.querySelector('#editStoryTagPicker')
        ,   frameClass: 'storypicker fullWidth'
        ,   tagClass: 'storyTag'
        ,   listClass: 'story list'
        ,   tag: 'Select Story:'
        ,   data: admin.vars.fullChapterList
        ,   dataprop: 'short'
            }, (position, value) => {
                admin.serverActions.getSeriesSettings()
                    .then((settings)=>{
                        admin.methods.applySettings(settings.filter((item) => {return (item.short === value);}));
                    });
        });
    });

    admin.vars.logLevelPicker = new admin.proto.picker({
        target: document.querySelector('#logLevelPicker')
    ,   frameClass: 'storypicker fullWidth'
    ,   tagClass: 'storyTag'
    ,   listClass: 'story list'
    ,   tag: 'Select Log-Level:'
    ,   data: [1,2,3,4,5,9,11]
    });


    document.querySelector('#logLevelButton').addEventListener('click', admin.handler.setLogLevel, false);
    document.querySelector('#serverActionsHead').addEventListener('click', admin.handler.showProperty, false);
    document.querySelector('#manageSeriesHead').addEventListener('click', admin.handler.showProperty, false);
    document.querySelector('#serverSettingsHead').addEventListener('click', admin.handler.showProperty, false);
    document.querySelector('#rebuildDB').addEventListener('click', admin.handler.resetChapterDB, false);
    document.querySelector('#markAllReadButton').addEventListener('click', admin.handler.markAllRead, false);
    document.querySelector('#markAllRead .toggleButton').addEventListener('click', admin.handler.markAllReadToggle, false);
    document.querySelector('#oneVar').addEventListener('click', admin.handler.toggleAddSeries, false);
    document.querySelector('#twoVar').addEventListener('click', admin.handler.toggleAddSeries, false);
    document.querySelector('#link').addEventListener('click', admin.handler.toggleAddSeries, false);
    document.querySelector('#addNewSeriesButton').addEventListener('click', admin.handler.toggleAddEditSeries, false);
    document.querySelector('#editSeries').addEventListener('click', admin.handler.toggleAddEditSeries, false);
    document.querySelector('#deleteSeries').addEventListener('click', admin.handler.toggleAddEditSeries, false);
    document.querySelector('#addSeriesButton').addEventListener('click', admin.handler.addSeries.bind(null, false), false);
    document.querySelector('#editSeriesButton').addEventListener('click', admin.handler.addSeries.bind(null, true), false);
    document.querySelector('#deleteSeriesButton').addEventListener('click', admin.handler.deleteSeries, false);
    document.querySelector('#restartServer').addEventListener('click', admin.handler.restartServer, false);
    document.querySelector('#readerLink').addEventListener('click', admin.handler.readerLink, false);
    document.querySelector('#triggerCrawler').addEventListener('click', admin.serverActions.manualRefresh, false);
});