

class Fetchwrap {

	constructor(mocking = true) {
		this.mocking = mocking;
		this.mocks = {};
		this.run = {};
		this.originalFetch = window.fetch;
		this.methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
	}

	//// replaces window.fetch with a mock framework
	fetch(url, options={}) {
		const method = 'method' in options ? options.method : 'GET';
		if (url in this.mocks && method in this.mocks[url]) {
			if (url in this.run && method in this.run[url]) {
				const mocksLen = this.mocks[url][method].length;
				const data = (this.run[method][url] >= mocksLen) ? 
					this.mocks[url][method][mocksLen - 1] : 	
					this.mocks[url][method][this.run[url] + 1];
				this.run[url][method]++; 	//// optimistic
				return this.promise(data);
			} else {
				if (!(url in this.run)) {
					this.run[url] = {};
				}
				this.run[url][method] = 1;
				return this.promise(this.mocks[url][method][0]);
			}
		} else {
			console.error('Unmatched url: ', url, Object.keys(this.mocks));
		}
	}

	//// returns a promise, like ftch would
	promise(data) {
		return new Promise((resolve, reject) => {
			resolve(new Response(JSON.stringify(data.body), data.options));
		});
	}

	mock(method, url, payload) {
		method = method.toUpperCase();
		if (!this.methods.includes(method)) {
			throw new Error('Bad Method ['+method+']. Valid methods are ' + this.methods, method);
		}
		if (Number.isInteger(payload)) {
			payload = {
				options: {
					status: payload
				},
				body: {}
			}
		} else if (payload instanceof Object) {
			if (!('body' in payload)) {
				const newPayload = { body: payload, options: { url } };
				if ('status' in payload) {
					newPayload.options.status = payload.status;
					delete(newPayload.body.status);
				} else {
					newPayload.options.status = 200;
				}
				payload = newPayload;
			}
		} else {
			throw new Error('bad payload');
		}
		if (url in this.mocks && method in this.mocks[url]) {
			this.mocks[url][method].push(payload);
		} else {
			if (!(url in this.mocks)) {
				this.mocks[url] = {};
			}
			this.mocks[url][method] = [ payload ];
		}
	}

	mockGet(url, payload) {
		this.mock('GET', url, payload);
	}

	mockPost(url, payload) {
		this.mock('POST', url, payload);
	}

	mockDelete(url, payload) {
		this.mock('DELETE', url, payload);
	}

	mockPut(url, payload) {
		this.mock('PUT', url, payload);
	}

	on() {
		this.mocking = true;
	}

	off() {
		this.mocking = false;
		this.mocks = {};
	}

}


const fetchwrap = new Fetchwrap(true);

//// assumes that 'fetchwrap' is somehow available
const fetchwrapper = (url, options) => {
	if (fetchwrap.mocking) {
		return fetchwrap.fetch(url, options);
	} else {
		return fetchwrap.originalFetch(url, options);
	}
};
window.fetch = fetchwrapper;

export default fetchwrap;