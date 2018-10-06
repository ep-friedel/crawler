function registerHandlers(back) {
	const 	h = back.handler,
			o = back.options,
			m = back.methods;

	m.log(0, 'registerHandlers');

	h.addSeries = (param) => {
		m.log(2, 'h:addSeries', param);

		return m.addSeries(param);
	};

	h.setQuidanUserInfo = (param) => {
		m.log(2, 'h:setQuidanUserInfo', param);

		return m.setQuidanUserInfo(param);
	};

	h.deleteSeries = (param) => {
		m.log(2, 'h:deleteSeries', param);

		return m.deleteSeries(param);
	};

	h.editSeries = (param) => {
		m.log(2, 'h:editSeries', param);

		return m.editSeries(param);
	};

	h.getNewChapterList = (userObject) => {
		m.log(2, 'h:getChapterList');

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError : m.getNewChapterList(userObject);
	};

	h.getNotificationSettings = (userObject) => {
		m.log(2, 'h:getNotificationSettings', userObject.user);

		return m.getNotificationSettings(userObject);
	};

	h.getStatus = () => {
		return m.status();
	};

	h.manualRefresh = () => {
		m.log(2, 'h:manualRefresh');

		m.getOptions().then(() => {
			m.updateDB();
		}).catch((e)=>{
			console.log(e);
		});
	};

	h.markNew = (param, userObject) => {
		m.log(3, 'h:markNew', param);
        let vars = m.escapeArray(['short', 'chapter'], param);

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError : m.setAsNewForUser(vars.chapter, vars.short, userObject);
	};

	h.markAllRead = (param, userObject) => {
		m.log(3, 'h:markAllRead', param);
		let userError = testForUserObjectError(userObject);

		return (userError) ? userError : (param.short !== undefined) ? m.markStoryRead(param.short, userObject) : m.markAllRead(userObject);
	};

	h.markRead = (param, userObject) => {
		m.log(3, 'h:markRead', param);

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError : m.markRead(param, userObject);
	};

	h.messageKey = (param, userObject, method) => {
		m.log(3, 'h:messageKey', param);

		if (userObject && userObject.user){
			m.messageKey(param, userObject, method);
		}
	};

	h.requestChapter = (param, userObject) => {
		m.log(2, 'h:request Chapter', param);

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError :  m.requestChapter(param, userObject);
	};

	h.requestFullChapterList = () => {
		m.log(2, 'h:requestFullChapterList');

		return m.requestFullChapterList();
	};

	h.requestSeriesSettings = () => {
		m.log(2, 'h:requestSeriesSettings');

		return m.requestSeriesSettings();
	};

	h.resetChapterDB = () => {
		m.log(2, 'h:resetChapterDB');

		m.resetChapterDB();
	};

	h.restartServer = () => {
		m.log(2, 'h:restartServer');

		m.restartServer();
	};

	h.setLogLevel = (param) => {
		m.log(2, 'h:setLogLevel');

		return m.setLogLevel(param.Level);
	};

	h.setNotificationSettings = (param, userObject) => {
		m.log(2, 'h:setNotificationSettings', param, userObject.user);

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError :  m.setNotificationSettings(param, userObject);
	};

	h.subscribeSeries = (param, userObject, del) => {
		m.log(2, 'h:subscribeSeries', param, userObject.user, del);

		let userError = testForUserObjectError(userObject);

		return (userError) ? userError :  m.subscribeSeries(param, userObject, del);
	};

	h.triggerBuild = (secret) => {
		m.log(2, 'h:subscribeSeries', secret);

		m.triggerBuild();
	};

	function testForUserObjectError(userObject) {
		if (userObject && userObject.user){
			return false;

		} else {
			return new Promise((resolve,reject) => reject('User Error'));
		}
	}

}

module.exports = registerHandlers;