import HttpStatus from 'http-status-codes';

class Fetchwrap {

	constructor(mocking = true) {
		this.mocking = mocking;
		this.mocks = {};
		this.run = {};
		this.originalFetch = window.fetch;
		this.methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']
	}

	fetch(url, options={}) {
		const method = 'method' in options ? options.method : 'GET';
		if (!this.methods.includes(method)) {
			throw new Error('Bad Method ['+method+']. Valid methods are ' + this.methods);
		}		
		if (this.urlPatternMatches(url) && method in this.mocks[url]) {
			if (url in this.run && method in this.run[url]) {
				const mocksLen = this.mocks[url][method].length;
				const payload = (this.run[url][method] >= mocksLen) ? 
					this.mocks[url][method][mocksLen - 1] : 	
					this.mocks[url][method][this.run[url][method]];
				this.run[url][method]++; 	//// optimistic
				return this.promise(this.fixPayload(url, payload));
			} else {
				if (!(url in this.run)) {
					this.run[url] = {};
				}
				this.run[url][method] = 1;
				return this.promise(this.fixPayload(url, this.mocks[url][method][0]));
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

	mock(method, url, payload={}) {
		method = method.toUpperCase();
		if (!this.methods.includes(method)) {
			throw new Error('Bad Method ['+method+']. Valid methods are ' + this.methods);
		}
		if (this.urlPatternMatches(url) && method in this.mocks[url]) {
			this.mocks[url][method].push(payload);
		} else {
			if (!(this.urlPatternMatches(url))) {
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

	fixPayload(url, payload) {

		if (Number.isInteger(payload)) {
			return {
				options: {
					status: payload,
					statusText: HttpStatus.getStatusText(payload)
				},
				body: {}
			}
		} else if (payload instanceof Object) {

			const newPayload = 'body' in payload ? 
				{ ...payload, options: { url }  } : 
				{ body: payload, options: { url } };
			if ('status' in payload) {
				newPayload.options.status = payload.status;
				delete(newPayload.body.status);
			} else {
				newPayload.options.status = 200;
			}
			newPayload.options.statusText = HttpStatus.getStatusText(newPayload.options.status);	
			return newPayload;
		} else {
			throw new Error('bad payload' + JSON.stringify(payload));
		}		
	}

	urlPatternMatches(url) {
		if (url in this.mocks) {
			return true;
		}
		for (let pattern in this.mocks) {
			if (this.mocks.hasOwnProperty(pattern)) {
				const regex = new RegExp(pattern);
				if (regex.test(url)) {
					return true;
				}		
			}
		}
		return false;
	}	

	on() {
		this.mocking = true;
	}

	off() {
		this.mocking = false;
		this.mocks = {};
		this.run = {};
	}

	clear() {
		this.mocks = {};
		this.run = {};		
	}

	validate() {
		let notCalled = [];
		Object.getOwnPropertyNames(this.mocks).forEach(url => {
			Object.getOwnPropertyNames(this.mocks[url]).forEach(method => {
				if (!(url in this.run) || !(method) in this.run[url]) {
					this.mocks[url][method].forEach(payload => notCalled.push({
						url,
						method,
						payload
					}));
				} else if (this.mocks[url][method].length > this.run[url][method]) {
					for (let i = this.run[url][method] - 1; i < this.mocks[url][method].length; i++) {
						notCalled.push({
							url,
							method,
							payload: this.mocks[url][method][i]							
						});
					}
				}
			});
		});
		return notCalled;
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