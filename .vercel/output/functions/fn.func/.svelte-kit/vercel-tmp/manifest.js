export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":{"file":"_app/immutable/entry/start.a66e3206.js","imports":["_app/immutable/entry/start.a66e3206.js","_app/immutable/chunks/index.fd34ff69.js","_app/immutable/chunks/singletons.4393610f.js","_app/immutable/chunks/paths.68ddc1cf.js"],"stylesheets":[],"fonts":[]},"app":{"file":"_app/immutable/entry/app.9fbf43d6.js","imports":["_app/immutable/entry/app.9fbf43d6.js","_app/immutable/chunks/index.fd34ff69.js"],"stylesheets":[],"fonts":[]}},
		nodes: [
			() => import('../output/server/nodes/0.js'),
			() => import('../output/server/nodes/1.js')
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
