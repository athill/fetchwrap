import HttpStatus from 'http-status-codes';

class Fetchwrap {

	constructor(mocking = true) {
		this.mocking = mocking;   			//// whether currently mocking
		this.mocks = {};					//// data structure of registered mocks
		this.run = {};						//// data structure of counts of registered mocks that have been run
    	this.matches = [];        //// array of matched fetched requests
		this.originalFetch = window.fetch;	//// native window.fetch
		//// valid http methods
		this.methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH'];
		//// generate convenience mock methods. e.g., get() ...
		this.methods.forEach(method => {
			this[method.toLowerCase()] = (url, payload={}) => this.mock(method, url, payload);
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
    const [path, query] = url.split('?');
		if (this.urlPatternMatches(url) && method in this.mocks[path]) {
			if (path in this.run && method in this.run[path]) {
				const mocksLen = this.mocks[path][method].length;
				const payload = (this.run[path][method] >= mocksLen) ?
					this.mocks[path][method][mocksLen - 1] :
					this.mocks[path][method][this.run[path][method]];
				this.run[path][method]++; 	//// optimistic
        this.matches.push({url: url, options});
        return this.promise(url, payload);
			} else {
				if (!(path in this.run)) {
					this.run[path] = {};
				}
				this.run[path][method] = 1;
        this.matches.push({url: url, options});
				return this.promise(url, this.mocks[path][method][0]);
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
	promise(url, data) {
    data = this.fixPayload(url, data);
		return new Promise((resolve, reject) => {
      const response = new Response(JSON.stringify(data.body), data.options);
        resolve(response);
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

  //// TODO: Add support for matching queries
	/**
	 * Checks if a url matches a registered mock url via string equality or regex
	 * @param {string} url - a url to match
	 * @return {boolean} whether the url matches a registered mock
	 */
	urlPatternMatches(url) {
    const [path, query] =  url.split('?');
		if (path in this.mocks) {
			return true;
		}
		for (let pattern in this.mocks) {
			if (this.mocks.hasOwnProperty(pattern)) {
				const regex = new RegExp(pattern);
				if (regex.test(path)) {
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
    this.clear();
	}

	/**
	 * resets mocks
	 */ 
	clear() {
		this.mocks = {};
		this.run = {};
    this.matches = [];
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
