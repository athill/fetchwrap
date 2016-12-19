

export class NetworkError extends Error {
  /**
   * NetworkError constructor
   *
   * @param response - A fetch response @see https://github.com/github/fetch
   * @param message  - Additional descriptive error message
   */
  constructor(response, message) {
    super(message);
    /** @type {string} */
    this.name = 'NetworkError';
    /** @type {string} */
    this.message = message;
    /** @type {string} */
    this.stack = (new Error(message)).stack;
    /** @type {string} */
    this.responseStatus = response.status;
    /** @type {string} */
    this.responseStatusText = response.statusText;
  }
}

/**
 * Convenience function for parsing the response body or throwing an error if the request failed.
 *
 * @param errorMessage - The error message to throw if the response status is a non-2xx code
 * @throws {NetworkError} throws an error if the response status is a non-2xx code
 */
export const parseJSON = errorMessage => response => {
  if (response.ok) {
    return response.json();
  } else {
    throw new NetworkError(response, errorMessage);
  }
};

/**
 * Asynchronously fetches data from a resource endpoint at /api/*.
 *
 * @param  {string} path                      - The name of the resource to fetch.
 * @param  {function(error: Error)} onFailure - A function to perform additional error handling the GET failed for any reason.
 *
 * @return  {Promise<Object[], Object[]>} A promise containing the list of resources, or an empty list if there was an error.
 */
export const getResource = (path, onFailure) => () => {
  return fetch(path, {
    credentials: 'same-origin'
  })
    .then(parseJSON(`Failed to retrieve resource at ${path}`))
    .catch(error => {
      if (onFailure) {
        onFailure(error);
      }
      throw error;
    });
};

export const fetchSubmit = (url, method, values, headers = {}) => {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/hal+json',
      ...headers
    },
    body: JSON.stringify(values),
    credentials: 'same-origin'
  });
};

export const parseFormErrors = (errors) => _.zipObject(errors.map(e => e.property), errors.map(e => e.message));

export const submitFormWithCsrf = (url, method, isDryRun = false) => (values) => {
  return new Promise((resolve, reject) => {
    fetch('/csrf/', { credentials: 'same-origin' })
      .then(parseJSON('Failed to obtain CSRF token'))
      .then(json => fetchSubmit(url, method, values, { [json.headerName]: json.token, 'X-DRY-RUN': isDryRun }))
      .then(response => {
        // If we get a 204 response, that means that dry-run validation succeeded
        if (response.status === 204) {
          resolve();
        }
        return response;
      })
      .then(response => response.json()
        .then(json => {
          if (response.ok) {
            resolve(json);
          } else if (response.status === 400) {
            reject(new SubmissionError(parseFormErrors(json.errors)));
          } else {
            throw new Error('A system error has occurred. Please try again later.');
          }
        }))
      .catch(error => reject(new SubmissionError({ _error: [ error.message ] })));
  });
};
