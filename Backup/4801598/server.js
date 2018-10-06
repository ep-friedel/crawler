#!/usr/bin/env node

const back = {
	'init': {
		'methods': 	require('./modules/core/methods')
	,	'router': 	require('./modules/core/router')
	,	'handler': 	require('./modules/core/handler')
	}
,	'methods': {}
,	'handler': {}
,	'mysql': {}
,	'options': 	require('./options.json')
,	'newChapterList': []
,   'startedAt': new Date()
};

back.init.methods(back);
back.init.handler(back);
back.init.router(back);

//back.methods.registerAutoRefresh();