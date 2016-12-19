import HttpStatus from 'http-status-codes';

class Fetchwrap {

	constructor(mocking = true) {
		this.mocking = mocking;   			//// whether currently mocking
		this.mocks = {};					//// data structure of registered mocks
		this.run = {};						//// data structure of counts of registered mocks that have been run
		this.originalFetch = window.fetch;	//// native window.fetch
		//// valid http methods
		this.methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
		//// generate convenience mock methods. e.g., mockGet() ...
		this.methods.forEach(method => {
			const methodName = 'mock' + method.charAt(0) + method.toLowerCase().slice(1);
			this[methodName] = (url, payload={}) => this.mock(method, url, payload);
		});
	}

	/**
	 * Mock version of fetch. Executes registered mock if it exists or throws error
	 * @param {string} url - endpoint to fetch data 
	 * @param {Object} options - options for fetch, {@link https://github.com/github/fetch}
	 * @return a Promise
	 */
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
			throw new Error('Unmatched url: ['+url+']. Valid endpoints are ' + Object.keys(this.mocks));
		}
	}

	/**
	 * returns a promise, like ftch would
	 * @params {Object} data - mock response data
	 * @return a Propmise
	 */
	promise(data) {
		return new Promise((resolve, reject) => {
			resolve(new Response(JSON.stringify(data.body), data.options));
		});
	}

	/**
	 * registers a mock with this.mocks
	 * @param {string} method - a valid method in this.methods
	 * @param {string} url - endpoint 
	 * @param {Object} payload - data used to build response
	 */
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

	/**
	 * Covert mock metadata to proper Request argument format
	 * @param {string} url - the requested url
	 * @param {object|number} payload - metadata for mctching mock
	 * @return {object} the formatted payload 
	 */
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

	/**
	 * Checks if a url matches a registered mock url via string equality or regex
	 * @param {string} url - a url to match
	 * @return {boolean} whether the url matches a registered mock
	 */
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


	/** 
	 * turns mocking on
	 */
	on() {
		this.mocking = true;
	}

	/**
	 * turns mcoking off and resets mocks
     */
	off() {
		this.mocking = false;
		this.mocks = {};
		this.run = {};
	}

	/**
	 * resets mocks
	 */ 
	clear() {
		this.mocks = {};
		this.run = {};		
	}

	/**
	 * returns an array of mocks not called
	 */
	validate() {
		let notCalled = [];
		Object.getOwnPropertyNames(this.mocks).forEach(url => {
			Object.getOwnPropertyNames(this.mocks[url]).forEach(method => {
				if (!(url in this.run) || !(method in this.run[url])) {
					this.mocks[url][method].forEach(payload => notCalled.push({
						url,
						method,
						payload
					}));
				} else if (this.mocks[url][method].length > this.run[url][method]) {
					for (let i = this.run[url][method]; i < this.mocks[url][method].length; i++) {
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


const fetchwrap = new Fetchwrap();

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